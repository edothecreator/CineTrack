import { Buffer } from "node:buffer";

const LOGIN_URL = "https://api4.thetvdb.com/v4/login";

let tokenCache: { token: string; expiresAtMs: number } | null = null;

function jwtExpiryMs(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(
      Buffer.from(part, "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function getTvdbBearerToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAtMs > now + 60_000) {
    return tokenCache.token;
  }

  const apikey = process.env.TVDB_API_KEY;
  if (!apikey) {
    console.error("TVDB_API_KEY is missing from environment variables. Please check your .env file or refer to .env.example.");
    throw new Error("TVDB_API_KEY_MISSING");
  }

  const pin = process.env.TVDB_PIN;
  const body = pin ? { apikey, pin } : { apikey };

  const res = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`TVDB_LOGIN_${res.status}`);
  }

  const json = (await res.json()) as { data?: { token?: string } };
  const token = json.data?.token;
  if (!token) {
    throw new Error("TVDB_LOGIN_NO_TOKEN");
  }

  const expiresAtMs = jwtExpiryMs(token) ?? now + 25 * 24 * 60 * 60 * 1000;
  tokenCache = { token, expiresAtMs };
  return token;
}
