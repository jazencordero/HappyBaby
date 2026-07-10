import { createHash, randomBytes } from "crypto";

// 32 random bytes → 43-char base64url token. The raw token lives only in the
// invite URL handed back to the parent; the DB stores its sha256 hex hash.
export function generateInvitationToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashInvitationToken(raw) };
}

export function hashInvitationToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function invitationUrl(raw: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/invite/${raw}`;
}
