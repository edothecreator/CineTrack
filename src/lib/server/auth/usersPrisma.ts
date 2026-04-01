import { prisma } from "@/lib/server/prisma";
import { hashPasswordBcrypt, needsRehash, verifyPassword } from "@/lib/server/auth/password";

function emailNormalize(email: string) {
  return email.trim().toLowerCase();
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerUserPrisma(input: {
  username: string;
  email: string;
  password: string;
}): Promise<
  | { ok: true; user: { id: string; username: string; email: string } }
  | { ok: false; status: number; message: string }
> {
  const username = (input.username ?? "").trim();
  const email = (input.email ?? "").trim();
  const password = input.password ?? "";

  if (!username || username.length < 2 || username.length > 64) {
    return {
      ok: false,
      status: 400,
      message: "username must be 2-64 characters",
    };
  }
  if (!email || !validateEmail(email)) {
    return {
      ok: false,
      status: 400,
      message: "email format is invalid",
    };
  }
  const normalizedEmail = emailNormalize(email);
  if (!password || password.length < 8) {
    return {
      ok: false,
      status: 400,
      message: "password must be at least 8 characters",
    };
  }

  const byEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  const byUsername = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (byEmail || byUsername) {
    return {
      ok: false,
      status: 409,
      message: "An account with that username or email already exists",
    };
  }

  const passwordHash = hashPasswordBcrypt(password);
  const user = await prisma.user.create({
    data: {
      username,
      email: normalizedEmail,
      passwordHash,
    },
  });

  return {
    ok: true,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

export async function loginUserPrisma(input: {
  email: string;
  password: string;
}): Promise<
  | { ok: true; user: { id: string; username: string; email: string } }
  | { ok: false; status: number; message: string }
> {
  const email = (input.email ?? "").trim();
  const password = input.password ?? "";

  if (!email || !validateEmail(email)) {
    return { ok: false, status: 400, message: "email format is invalid" };
  }
  if (!password) {
    return { ok: false, status: 400, message: "password cannot be empty" };
  }

  const normalizedEmail = emailNormalize(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user) {
    return { ok: false, status: 401, message: "Invalid email or password" };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return { ok: false, status: 401, message: "Invalid email or password" };
  }

  if (needsRehash(user.passwordHash)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPasswordBcrypt(password) },
    });
  }

  return {
    ok: true,
    user: { id: user.id, username: user.username, email: user.email },
  };
}
