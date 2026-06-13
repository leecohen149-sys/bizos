import { z } from "zod"

import { RESOURCE_LIST } from "./resources"
import { ALL_SCOPES } from "./resources"

/**
 * OpenAPI 3.1 document for the public automation API, generated from the same
 * Zod request schemas used for runtime validation (single source of truth).
 * Built with Zod 4's native z.toJSONSchema — no external generator dependency,
 * so it can't drift from the validation layer or break the webpack build.
 */

type JsonSchema = Record<string, unknown>

function toSchema(schema: z.ZodTypeAny): JsonSchema {
  // Zod emits JSON Schema 2020-12, which OpenAPI 3.1 embeds directly.
  const json = z.toJSONSchema(schema, { io: "input" }) as JsonSchema
  delete json.$schema
  return json
}

const errorSchema: JsonSchema = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
      },
      required: ["code", "message"],
    },
  },
  required: ["error"],
}

const listMetaSchema: JsonSchema = {
  type: "object",
  properties: {
    next_cursor: { type: ["string", "null"] },
    has_more: { type: "boolean" },
  },
  required: ["next_cursor", "has_more"],
}

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
})

const commonErrors = {
  "401": errorResponse("Missing or invalid API key."),
  "403": errorResponse("API key lacks the required scope."),
  "422": errorResponse("Validation failed."),
  "429": errorResponse("Rate limit exceeded."),
}

const rateLimitHeadersSpec = {
  "X-RateLimit-Limit": { schema: { type: "integer" }, description: "Requests allowed per window." },
  "X-RateLimit-Remaining": { schema: { type: "integer" }, description: "Requests remaining." },
  "X-RateLimit-Reset": { schema: { type: "integer" }, description: "Seconds until the bucket refills." },
}

export function buildOpenApiDocument(appUrl: string) {
  const schemas: Record<string, JsonSchema> = {
    Error: errorSchema,
    ListMeta: listMetaSchema,
  }
  const paths: Record<string, JsonSchema> = {}

  for (const cfg of RESOURCE_LIST) {
    const Create = `${cfg.label}Create`
    const Update = `${cfg.label}Update`
    schemas[Create] = toSchema(cfg.createSchema)
    schemas[Update] = toSchema(cfg.updateSchema)

    const collection = `/api/v1/${cfg.resource}`
    const item = `/api/v1/${cfg.resource}/{id}`
    const tag = cfg.label

    paths[collection] = {
      get: {
        tags: [tag],
        summary: `List ${cfg.resource}`,
        description:
          "Cursor-paginated. Pass `updated_since` (ISO-8601) to poll only rows changed since a timestamp — ideal for an n8n Schedule Trigger.",
        security: [{ BizosApiKey: [] }],
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" }, description: "Opaque pagination cursor from a previous `meta.next_cursor`." },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          { name: "updated_since", in: "query", schema: { type: "string", format: "date-time" }, description: "Return rows with updated_at >= this timestamp, oldest first." },
        ],
        responses: {
          "200": {
            description: "OK",
            headers: rateLimitHeadersSpec,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { type: "array", items: { type: "object" } }, meta: { $ref: "#/components/schemas/ListMeta" } },
                  required: ["data", "meta"],
                },
              },
            },
          },
          ...commonErrors,
        },
      },
      post: {
        tags: [tag],
        summary: `Create a ${cfg.resource.replace(/s$/, "")}`,
        security: [{ BizosApiKey: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: `#/components/schemas/${Create}` } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { data: { type: "object" } } } } } },
          ...commonErrors,
        },
      },
    }

    paths[item] = {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: [tag],
        summary: `Get a ${cfg.resource.replace(/s$/, "")} by id`,
        security: [{ BizosApiKey: [] }],
        responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { data: { type: "object" } } } } } }, "404": errorResponse("Not found."), ...commonErrors },
      },
      patch: {
        tags: [tag],
        summary: `Update a ${cfg.resource.replace(/s$/, "")}`,
        security: [{ BizosApiKey: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${Update}` } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { data: { type: "object" } } } } } }, "404": errorResponse("Not found."), ...commonErrors },
      },
      delete: {
        tags: [tag],
        summary: `Delete a ${cfg.resource.replace(/s$/, "")}`,
        security: [{ BizosApiKey: [] }],
        responses: { "204": { description: "Deleted (no content)." }, "404": errorResponse("Not found."), ...commonErrors },
      },
    }
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "BizOS Automation API",
      version: "1.0.0",
      description:
        `Public REST API for automating BizOS from n8n, Make, Zapier and friends.\n\n` +
        `**Auth:** send your key as \`Authorization: Bearer bizos_live_…\`.\n\n` +
        `**Scopes:** ${ALL_SCOPES.filter((s) => s !== "*").join(", ")} (or \`*\`).\n\n` +
        `**Webhooks:** register endpoints in the app to receive \`*.created\` / \`*.updated\` events, ` +
        `signed with HMAC-SHA256 in the \`X-Bizos-Signature\` header.`,
    },
    servers: [{ url: appUrl }],
    security: [{ BizosApiKey: [] }],
    tags: RESOURCE_LIST.map((c) => ({ name: c.label })),
    paths,
    components: {
      securitySchemes: {
        BizosApiKey: { type: "http", scheme: "bearer", description: "API key issued in Settings → Integrations." },
      },
      schemas,
    },
  }
}
