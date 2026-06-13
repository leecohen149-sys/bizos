import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * HMAC-SHA256 webhook signing. The signature covers `${timestamp}.${rawBody}`
 * so consumers can reject replays. Consumers verify with:
 *   expected = hex( HMAC_SHA256(secret, `${X-Bizos-Timestamp}.${rawBody}`) )
 *   timingSafeEqual(expected, X-Bizos-Signature)
 */

export function signWebhook(rawBody: string, secret: string, timestamp: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex")
}

export function buildSignedHeaders(
  rawBody: string,
  secret: string,
  eventId: string,
  timestampSeconds: number
): Record<string, string> {
  const ts = String(timestampSeconds)
  return {
    "Content-Type": "application/json; charset=utf-8",
    "User-Agent": "BizOS-Webhooks/1",
    "X-Bizos-Event-Id": eventId,
    "X-Bizos-Timestamp": ts,
    "X-Bizos-Signature": signWebhook(rawBody, secret, ts),
  }
}

/** Verify a signature (for the in-app docs example + tests). */
export function verifyWebhook(
  rawBody: string,
  secret: string,
  timestamp: string,
  signature: string
): boolean {
  const expected = signWebhook(rawBody, secret, timestamp)
  const a = Buffer.from(expected, "utf8")
  const b = Buffer.from(signature, "utf8")
  return a.length === b.length && timingSafeEqual(a, b)
}
