import crypto from "node:crypto";

type AuthTokenPayload = {
  sub: string; // user id
  email: string;
  username: string;
  exp: number; // unix seconds
};

// NOTE: For real deployments, set AUTH_SECRET in env.
// This fallback is only for local development/testing.
const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "dev_auth_secret_change_me";

const base64UrlEncode = (buf: Buffer) =>
  buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (str: string) => {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Pad back to a multiple of 4 for base64 decoding
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
};

export function createAuthToken(payload: Omit<AuthTokenPayload, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7d
  const fullPayload: AuthTokenPayload = { ...payload, exp };

  const payloadJson = JSON.stringify(fullPayload);
  const payloadB64 = base64UrlEncode(Buffer.from(payloadJson, "utf8"));

  const sig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadB64)
    .digest();

  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;

  const expectedSig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadB64)
    .digest();

  const actualSig = base64UrlDecode(sigB64);

  if (actualSig.length !== expectedSig.length) return null;
  try {
    if (!crypto.timingSafeEqual(actualSig, expectedSig)) return null;
  } catch {
    return null;
  }

  let payload: unknown;
  try {
    const json = base64UrlDecode(payloadB64).toString("utf8");
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("sub" in payload) ||
    !("email" in payload) ||
    !("username" in payload) ||
    !("exp" in payload)
  ) {
    return null;
  }

  const p = payload as AuthTokenPayload;
  if (typeof p.sub !== "string") return null;
  if (typeof p.email !== "string") return null;
  if (typeof p.username !== "string") return null;
  if (typeof p.exp !== "number") return null;

  const now = Math.floor(Date.now() / 1000);
  if (p.exp <= now) return null;
  return p;
}

