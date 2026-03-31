import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { verifyAuthToken } from "@/lib/auth/crypto";
import { AUTH_COOKIE } from "@/lib/server/auth/cookieOptions";

/**
 * Server-component-safe session check using the Next.js `cookies()` API.
 * Use `getAuthedUserId` (from session.ts) in API routes (NextRequest).
 */
export function getAuthedUserIdFromCookies(
  cookieStore: ReadonlyRequestCookies,
): string | null {
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyAuthToken(token);
  if (!payload?.sub) return null;
  return payload.sub;
}
