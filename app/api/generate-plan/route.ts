import { NextResponse, type NextRequest } from "next/server";
import { dayContextSchema } from "@/lib/validation/input";
import { generateMealPlan, GeminiError } from "@/lib/gemini/client";
import { normalizePlan } from "@/lib/plan/normalize";
import { getCachedPlan, hashContext, setCachedPlan } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import type {
  ApiErrorCode,
  ApiErrorResponse,
  DayContext,
  GeneratePlanResponse,
} from "@/lib/types";

// Real AI + per-request nonce/rate state require the Node runtime, not edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Maps a typed error code to an HTTP status and user-facing message. */
const ERROR_MAP: Record<ApiErrorCode, { status: number; message: string }> = {
  invalid_json: { status: 400, message: "Request body must be valid JSON." },
  validation_failed: { status: 400, message: "Some inputs were invalid." },
  rate_limited: {
    status: 429,
    message: "You're generating plans too quickly. Please wait a moment and try again.",
  },
  timeout: {
    status: 504,
    message: "The AI took too long to respond. Please try again.",
  },
  empty_response: {
    status: 502,
    message: "The AI returned an empty response. Please try again.",
  },
  invalid_ai_output: {
    status: 502,
    message: "The AI response was malformed. Please try again.",
  },
  upstream_error: {
    status: 502,
    message: "The AI service is temporarily unavailable. Please try again.",
  },
  misconfigured: {
    status: 500,
    message: "The server is misconfigured. Please contact the site owner.",
  },
};

function errorResponse(code: ApiErrorCode, details?: unknown): NextResponse<ApiErrorResponse> {
  const { status, message } = ERROR_MAP[code];
  return NextResponse.json({ error: message, code, details }, { status });
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "anonymous";
}

export async function POST(request: NextRequest) {
  // 1. Rate limit per client.
  const rate = checkRateLimit(clientKey(request));
  if (!rate.allowed) {
    const response = errorResponse("rate_limited");
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }

  // 2. Parse JSON body defensively.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json");
  }

  // 3. Validate input.
  const parsed = dayContextSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("validation_failed", parsed.error.flatten().fieldErrors);
  }
  const context = parsed.data as DayContext;

  // 4. Serve from cache when possible (saves an API call).
  const key = hashContext(context);
  const cached = getCachedPlan(key);
  if (cached) {
    const payload: GeneratePlanResponse = {
      plan: cached,
      meta: { model: "cache", latencyMs: 0, cached: true, revised: cached.budget.status === "revised_to_fit" },
    };
    return NextResponse.json(payload);
  }

  // 5. Real Gemini generation + normalization.
  const start = Date.now();
  try {
    const { plan: rawPlan, model } = await generateMealPlan(context);
    const plan = normalizePlan(rawPlan, context);
    setCachedPlan(key, plan);

    const payload: GeneratePlanResponse = {
      plan,
      meta: {
        model,
        latencyMs: Date.now() - start,
        cached: false,
        revised: plan.budget.status === "revised_to_fit",
      },
    };
    return NextResponse.json(payload);
  } catch (error) {
    const code = error instanceof GeminiError ? error.code : "upstream_error";
    return errorResponse(code);
  }
}
