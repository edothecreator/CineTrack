import { NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOpts } from "@/lib/server/auth/cookieOptions";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", {
    ...authCookieOpts,
    maxAge: 0,
  });
  return res;
}
