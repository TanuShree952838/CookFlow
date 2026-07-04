import {
  GoogleGenerativeAI,
  GoogleGenerativeAIAbortError,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";
import type { ZodError } from "zod";
import { geminiResponseSchema } from "@/lib/gemini/schema";
import { buildPrompt, buildRepairPrompt } from "@/lib/gemini/prompt";
import { rawMealPlanSchema, type RawMealPlanParsed } from "@/lib/validation/output";
import type { ApiErrorCode, DayContext } from "@/lib/types";

const DEFAULT_MODEL = "gemini-2.5-flash";
// Free-tier gemini-2.5-flash latency varies (single-digit up to ~20s). This is
// generous headroom; a timeout is not retried, and the worst case of two full
// attempts (~51s) still fits inside the route's maxDuration of 60s.
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_OUTPUT_TOKENS = 4096;
// Total model attempts. One retry covers BOTH transient transport errors
// (e.g. a 503 "overloaded" from the free tier) and schema-repair. Kept at 2 so
// the worst case stays comfortably under the serverless maxDuration.
const MAX_ATTEMPTS = 2;
const BACKOFF_MS = 1_200;

/** Error carrying a stable, client-safe code for HTTP mapping. */
export class GeminiError extends Error {
  readonly code: ApiErrorCode;
  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
  }
}

export interface GeneratedPlan {
  plan: RawMealPlanParsed;
  model: string;
}

type ParseResult =
  | { ok: true; value: RawMealPlanParsed }
  | { ok: false; reason: string };

/**
 * Generates and validates a meal plan with a real Gemini call.
 *
 * A single bounded retry loop handles two failure modes:
 *   - Transient transport errors (e.g. a 503 "overloaded" from the free tier)
 *     are retried with the same prompt after a short backoff.
 *   - Unparseable / schema-invalid output triggers a repair prompt that feeds
 *     the bad output back for self-correction on the next attempt.
 * Permanent errors (rate limit, misconfiguration, timeout) fail fast with a
 * typed code the API route maps to a precise HTTP status.
 */
export async function generateMealPlan(context: DayContext): Promise<GeneratedPlan> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiError("misconfigured", "GEMINI_API_KEY is not configured");
  }

  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: geminiResponseSchema,
      temperature: 0.5,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  let prompt = buildPrompt(context);
  let lastReason = "unknown validation error";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await delay(BACKOFF_MS * attempt);

    let text: string;
    try {
      text = await callModel(model, prompt);
    } catch (error) {
      const gemError = error instanceof GeminiError ? error : classifyError(error);
      if (isRetryable(gemError.code) && attempt < MAX_ATTEMPTS - 1) continue;
      throw gemError;
    }

    const parsed = parsePlan(text);
    if (parsed.ok) {
      return { plan: parsed.value, model: modelName };
    }

    // Schema failure: switch to a repair prompt for the next attempt.
    lastReason = parsed.reason;
    prompt = buildRepairPrompt(context, text, parsed.reason);
  }

  throw new GeminiError(
    "invalid_ai_output",
    `The AI response did not match the required format (${lastReason})`.slice(0, 180),
  );
}

async function callModel(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  prompt: string,
): Promise<string> {
  try {
    // The timeout is enforced with Promise.race rather than the SDK's own
    // `timeout`/`signal` options: those construct an AbortSignal that the
    // underlying fetch (undici) rejects across some runtimes. Racing a timer is
    // runtime-independent. The serverless `maxDuration` is the hard backstop.
    const result = await withTimeout(
      model.generateContent(prompt),
      REQUEST_TIMEOUT_MS,
    );
    const text = result.response.text()?.trim();
    if (!text) {
      throw new GeminiError("empty_response", "The AI returned an empty response");
    }
    return text;
  } catch (error) {
    throw classifyError(error);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new GeminiError("timeout", "The AI request timed out")),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function parsePlan(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, reason: "Response was not valid JSON" };
  }
  const parsed = rawMealPlanSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, reason: summarizeZodError(parsed.error) };
  }
  return { ok: true, value: parsed.data };
}

function summarizeZodError(error: ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

/** Transport errors worth retrying with backoff (usually transient overload). */
function isRetryable(code: ApiErrorCode): boolean {
  return code === "upstream_error";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classifyError(error: unknown): GeminiError {
  if (error instanceof GeminiError) {
    return error;
  }
  if (error instanceof GoogleGenerativeAIAbortError) {
    return new GeminiError("timeout", "The AI request timed out");
  }
  if (error instanceof GoogleGenerativeAIFetchError) {
    const status = error.status ?? 0;
    if (status === 429) {
      return new GeminiError("rate_limited", "The AI service is rate limited");
    }
    if (status === 400 || status === 401 || status === 403) {
      return new GeminiError("misconfigured", "The AI request was rejected");
    }
    if (status >= 500) {
      return new GeminiError("upstream_error", "The AI service is unavailable");
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  if (/quota|rate limit/i.test(message)) {
    return new GeminiError("rate_limited", "The AI service is rate limited");
  }
  if (/\[5\d\d|overloaded|unavailable/i.test(message)) {
    return new GeminiError("upstream_error", "The AI service is unavailable");
  }
  return new GeminiError("upstream_error", "Failed to reach the AI service");
}
