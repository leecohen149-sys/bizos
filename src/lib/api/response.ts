import "server-only"

/**
 * Consistent JSON shapes for the public /api/v1 surface.
 * Success: { data, meta? }   Error: { error: { code, message } }
 * Keeping these stable makes the API predictable for n8n / Make / Zapier.
 */

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" }

export type ListMeta = { next_cursor: string | null; has_more: boolean }

export function ok(
  data: unknown,
  init?: { meta?: ListMeta; headers?: Record<string, string>; status?: number }
): Response {
  const body = init?.meta ? { data, meta: init.meta } : { data }
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { ...JSON_HEADERS, ...init?.headers },
  })
}

export function created(data: unknown, headers?: Record<string, string>): Response {
  return ok(data, { status: 201, headers })
}

export function noContent(headers?: Record<string, string>): Response {
  return new Response(null, { status: 204, headers })
}

export function apiError(
  code: string,
  message: string,
  status: number,
  headers?: Record<string, string>
): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  })
}

/** Canonical error responses (stable `code` values for consumers to switch on). */
export const ERRORS = {
  unauthorized: () =>
    apiError("unauthorized", "Missing or invalid API key.", 401),
  forbidden: (msg = "This API key lacks the required scope.") =>
    apiError("forbidden", msg, 403),
  notFound: (msg = "Resource not found.") => apiError("not_found", msg, 404),
  invalidRequest: (msg: string) => apiError("invalid_request", msg, 422),
  rateLimited: (retryAfterSeconds: number, headers: Record<string, string>) =>
    apiError("rate_limited", "Rate limit exceeded.", 429, {
      "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))),
      ...headers,
    }),
  serverError: (msg = "Internal server error.") =>
    apiError("server_error", msg, 500),
} as const
