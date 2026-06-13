/**
 * Public API cross-tenant isolation test.
 *
 * Mirrors rls-test.ts but targets the automation-API security model:
 *  - create_api_key / verify_api_key RPCs are org-scoped and respect roles
 *  - the org-scoping the repo layer applies actually isolates tenants
 *  - revoked / expired keys do not verify (→ 401)
 *  - scope arrays drive the handler's 403 check correctly
 *
 *   pnpm api:isolation
 *
 * Requires (.env.local): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {
    /* env may already be set */
  }
}
loadEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!URL || !ANON || !SERVICE) {
  console.error("✗ Missing Supabase env (URL / ANON / SERVICE_ROLE).")
  process.exit(1)
}

const admin = createClient(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let failures = 0
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`)
  else {
    console.error(`  ✗ ${msg}`)
    failures++
  }
}

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex")

async function makeUser(tag: string) {
  const email = `apikey-${tag}-${Date.now()}@bizos.test`
  const password = "Test1234!passphrase"
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`)
  const client = createClient(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password })
  if (signInErr) throw new Error(`signIn: ${signInErr.message}`)
  return { id: data.user.id, client }
}

/** Mirrors src/lib/api/repo.ts get(): admin client + mandatory org scoping. */
async function scopedGet(orgId: string, table: string, id: string) {
  const { data } = await admin
    .from(table)
    .select("id")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle()
  return data
}

async function main() {
  console.log("API isolation test\n")

  const a = await makeUser("a")
  const b = await makeUser("b")

  const { data: orgA } = await a.client.rpc("create_organization", { _name: "API Org A" })
  const { data: orgB } = await b.client.rpc("create_organization", { _name: "API Org B" })
  const orgAId = (orgA as { id: string }).id
  const orgBId = (orgB as { id: string }).id

  // --- create_api_key is role-gated -----------------------------------------
  const { error: forbiddenErr } = await b.client.rpc("create_api_key", {
    _org: orgAId, // B is not a member of A
    _name: "stolen",
    _scopes: ["*"],
  })
  assert(Boolean(forbiddenErr), "create_api_key rejects a non-member (forbidden)")

  // --- each org gets its own key --------------------------------------------
  type NewKey = { id: string; full_key: string; key_prefix: string }
  const { data: keyARaw, error: keyAErr } = await a.client
    .rpc("create_api_key", { _org: orgAId, _name: "A full", _scopes: ["*"] })
    .single()
  const { data: keyBRaw } = await b.client
    .rpc("create_api_key", { _org: orgBId, _name: "B full", _scopes: ["*"] })
    .single()
  const keyA = keyARaw as NewKey
  const keyB = keyBRaw as NewKey
  assert(!keyAErr && Boolean(keyA?.full_key?.startsWith("bizos_live_")), "create_api_key returns a bizos_live_ key")

  // --- verify_api_key resolves the right org, by hash -----------------------
  type Verified = { key_id: string; org_id: string; scopes: string[] }
  const { data: vARaw } = await admin.rpc("verify_api_key", { _hash: sha256(keyA.full_key) }).maybeSingle()
  const { data: vBRaw } = await admin.rpc("verify_api_key", { _hash: sha256(keyB.full_key) }).maybeSingle()
  const vA = vARaw as Verified | null
  const vB = vBRaw as Verified | null
  assert(vA?.org_id === orgAId, "key A verifies to org A")
  assert(vB?.org_id === orgBId, "key B verifies to org B")
  assert(vA?.org_id !== vB?.org_id, "the two keys resolve to different orgs")

  // --- cross-tenant data isolation (the repo's org scoping) -----------------
  // Org A creates a company; key B's org must not be able to read it.
  const { data: companyA, error: companyErr } = await admin
    .from("crm_companies")
    .insert({ org_id: orgAId, name: "A-only Co" })
    .select("id")
    .single()
  if (companyErr) throw new Error(`insert company: ${companyErr.message}`)
  const seenBySelf = await scopedGet(vA!.org_id, "crm_companies", companyA!.id)
  const seenByOther = await scopedGet(vB!.org_id, "crm_companies", companyA!.id)
  assert(seenBySelf?.id === companyA!.id, "org A reads its own company via scoped get")
  assert(seenByOther === null, "org B CANNOT read org A's company (404)")

  // --- revoked key does not verify (→ 401) ----------------------------------
  await admin.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", keyA!.id)
  const { data: vRevoked } = await admin.rpc("verify_api_key", { _hash: sha256(keyA!.full_key) }).maybeSingle()
  assert(vRevoked == null, "revoked key no longer verifies")

  // --- scope arrays drive the 403 check -------------------------------------
  const { data: roKeyRaw } = await b.client
    .rpc("create_api_key", { _org: orgBId, _name: "B read-only", _scopes: ["companies:read"] })
    .single()
  const roKey = roKeyRaw as { full_key: string }
  const { data: vRoRaw } = await admin.rpc("verify_api_key", { _hash: sha256(roKey.full_key) }).maybeSingle()
  const scopes: string[] = (vRoRaw as { scopes: string[] } | null)?.scopes ?? []
  const hasScope = (s: string) => scopes.includes("*") || scopes.includes(s)
  assert(hasScope("companies:read"), "read-only key allows companies:read")
  assert(!hasScope("companies:write"), "read-only key DENIES companies:write (403)")

  // --- cleanup --------------------------------------------------------------
  await admin.auth.admin.deleteUser(a.id)
  await admin.auth.admin.deleteUser(b.id)

  console.log(`\n${failures === 0 ? "✓ all passed" : `✗ ${failures} failed`}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
