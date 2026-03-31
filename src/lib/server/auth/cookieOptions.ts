export const AUTH_COOKIE = "auth_token";

export const authCookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
  secure: process.env.NODE_ENV === "production",
};
