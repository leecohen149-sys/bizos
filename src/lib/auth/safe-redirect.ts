/**
 * Validates a post-auth redirect target. Returns the value only if it is a
 * safe internal relative path (single leading `/`, not `//` or `/\`, no
 * protocol/host) to prevent open-redirect attacks. Otherwise returns null.
 */
export function safeRelativePath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null
  // Must be an absolute internal path, not a protocol-relative or backslash URL.
  if (!value.startsWith("/")) return null
  if (value.startsWith("//") || value.startsWith("/\\")) return null
  return value
}
