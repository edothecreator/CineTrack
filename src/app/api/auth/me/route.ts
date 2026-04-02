import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/crypto";
import { AUTH_COOKIE } from "@/lib/server/auth/cookieOptions";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json(
    {
      user: {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
      },
      exp: payload.exp,
    },
    { status: 200 }
  );
}

