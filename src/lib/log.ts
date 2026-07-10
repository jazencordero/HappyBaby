// Never log record titles/content or any user-entered data — only IDs and
// action metadata.
export function logError(
  context: string,
  err: unknown,
  meta: Record<string, string | boolean | undefined> = {}
) {
  const message =
    err instanceof Error
      ? err.message
      : err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
  console.error(`[${context}]`, message, meta);
}
