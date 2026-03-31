import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const LEGACY_PREFIX = "legacy_scrypt:";
const BCRYPT_ROUNDS = 12;

export function hashPasswordBcrypt(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

function verifyLegacyScrypt(
  plain: string,
  saltB64: string,
  hashHex: string,
): boolean {
  try {
    const derived = crypto.scryptSync(plain, saltB64, 32, {
      N: 16384,
      r: 8,
      p: 1,
    });
    return derived.toString("hex") === hashHex;
  } catch {
    return false;
  }
}

/**
 * Stored formats:
 * - bcrypt hashes (`$2a$` / `$2b$`)
 * - `legacy_scrypt:{saltB64}:{hashHex}` (migrated from file-based `userDb`)
 */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored || !plain) return false;
  if (stored.startsWith("$2")) {
    return bcrypt.compareSync(plain, stored);
  }
  if (stored.startsWith(LEGACY_PREFIX)) {
    const rest = stored.slice(LEGACY_PREFIX.length);
    const i = rest.indexOf(":");
    if (i <= 0) return false;
    const salt = rest.slice(0, i);
    const hash = rest.slice(i + 1);
    return verifyLegacyScrypt(plain, salt, hash);
  }
  return false;
}

export function isLegacyPasswordHash(stored: string): boolean {
  return stored.startsWith(LEGACY_PREFIX);
}

export function needsRehash(stored: string): boolean {
  return isLegacyPasswordHash(stored);
}
