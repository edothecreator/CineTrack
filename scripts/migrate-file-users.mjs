/**
 * One-time: import users from data/auth/users.json (legacy file-based auth)
 * into PostgreSQL with scrypt-compatible password hashes.
 *
 * Usage: set DATABASE_URL, then `npm run db:migrate-file-users`
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const LEGACY_PREFIX = "legacy_scrypt:";

function formatLegacy(saltB64, hashHex) {
  return `${LEGACY_PREFIX}${saltB64}:${hashHex}`;
}

async function main() {
  const p = path.join(process.cwd(), "data", "auth", "users.json");
  let raw;
  try {
    raw = await fs.readFile(p, "utf8");
  } catch {
    console.error("Missing file:", p);
    process.exitCode = 1;
    return;
  }
  const users = JSON.parse(raw);
  if (!Array.isArray(users)) {
    console.error("users.json must be an array");
    process.exitCode = 1;
    return;
  }
  for (const u of users) {
    if (!u?.id || !u?.email || !u?.password?.salt || !u?.password?.hash) continue;
    const email = String(u.email).trim().toLowerCase();
    const passwordHash = formatLegacy(u.password.salt, u.password.hash);
    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        username: String(u.username ?? "user"),
        email,
        passwordHash,
      },
      update: {
        username: String(u.username ?? "user"),
        email,
        passwordHash,
      },
    });
    console.log("Upserted", email);
  }
  console.log("Done.");
}

main().finally(() => prisma.$disconnect());
