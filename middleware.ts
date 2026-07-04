import { NextResponse, type NextRequest } from "next/server";

/**
 * Generates a strict, nonce-based Content-Security-Policy per request.
 *
 * A fresh nonce is minted for every response and exposed to the app via the
 * `x-nonce` request header. Next.js automatically stamps this nonce onto its
 * own inline/bootstrap scripts, and the root layout stamps it onto the theme
 * script. `strict-dynamic` then trusts any script those nonced scripts load,
 * which lets us drop `unsafe-inline`/`unsafe-eval` for scripts entirely — the
 * strongest practical XSS defense for a Next.js app.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function middleware(request: NextRequest): NextResponse {
  const nonce = generateNonce();

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // React applies inline styles; nonces are impractical for style attributes.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Apply to all routes except static assets and image optimization, which do
  // not execute scripts and don't need a per-request nonce.
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
