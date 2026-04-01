import { NextRequest, NextResponse } from "next/server";
import { createAuthToken } from "@/lib/auth/crypto";
import { AUTH_COOKIE, authCookieOpts } from "@/lib/server/auth/cookieOptions";
import { registerUserPrisma } from "@/lib/server/auth/usersPrisma";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("username" in body) ||
    !("email" in body) ||
    !("password" in body)
  ) {
    return NextResponse.json(
      { message: "username, email, and password are required" },
      { status: 400 }
    );
  }

  const record = body as Record<string, unknown>;
  const username = typeof record.username === "string" ? record.username : "";
  const email = typeof record.email === "string" ? record.email : "";
  const password = typeof record.password === "string" ? record.password : "";

  const result = await registerUserPrisma({
    username,
    email,
    password,
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    );
  }

  const token = createAuthToken({
    sub: result.user.id,
    email: result.user.email,
    username: result.user.username,
  });

  const res = NextResponse.json(
    { message: "Registration successful", user: result.user },
    { status: 201 }
  );
  res.cookies.set(AUTH_COOKIE, token, authCookieOpts);
  return res;
}

