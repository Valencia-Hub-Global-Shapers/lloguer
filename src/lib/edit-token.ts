import { createHash, randomBytes } from "node:crypto";

/** Random, URL-safe edit token (256 bits). Shown to the poster once. */
export function generateEditToken(): string {
  return randomBytes(32).toString("base64url");
}

/** sha256 hex digest: the only form of the token stored in the database. */
export function hashEditToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
