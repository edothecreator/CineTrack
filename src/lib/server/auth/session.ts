import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth/crypto";

export function getAuthedUserId(req: NextRequest): string | null {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  const payload = verifyAuthToken(token);
  if (!payload?.sub) return null;
  return payload.sub;
}
