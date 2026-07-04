/**
 * Sanitizes free-text user input before it is embedded in an AI prompt.
 *
 * This is a defense-in-depth layer against prompt injection. The primary
 * defense is structural (untrusted text is fenced and labelled as data in the
 * prompt), but we also:
 *   - strip control characters that could smuggle hidden instructions,
 *   - collapse excessive whitespace,
 *   - remove backtick fences the user might use to break out of our delimiters,
 *   - neutralize common "ignore previous instructions" style phrasing.
 *
 * Output is always plain text; React escaping handles XSS on render.
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const FENCE_SEQUENCES = /```+|~~~+|<\|.*?\|>/g;
const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?/gi,
  /disregard\s+(?:the\s+)?(?:previous|prior|above|system)/gi,
  /you\s+are\s+now\s+(?:a|an)\b/gi,
  /system\s*prompt/gi,
];

export function sanitizeUserText(input: string): string {
  let text = input.normalize("NFC").replace(CONTROL_CHARS, " ");
  text = text.replace(FENCE_SEQUENCES, " ");
  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, "[removed]");
  }
  // Collapse runs of whitespace/newlines into single spaces to keep the prompt
  // compact and predictable.
  return text.replace(/\s+/g, " ").trim();
}
