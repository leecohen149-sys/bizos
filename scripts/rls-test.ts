/**
 * RLS cross-tenant isolation test.
 *
 * Creates two users in two separate orgs, then asserts that a user in org A
 * cannot read or write org B's rows. Runs against the LINKED Supabase project.
 *
 *   pnpm rls:test
 *
 * Requires env (loaded from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

// --- tiny .env.local loader (no extra deps) ---------------------------------
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
      }
    }
  } catch {
    /* env may already be set in CI */
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
  if (cond) {
    console.log(`  ✓ ${msg}`)
  } else {
    console.error(`  ✗ ${msg}`)
    failures++
  }
}

async function makeUser(tag: string) {
  const email = `rls-${tag}-${Date.now()}@bizos.test`
  const password = "Test1234!passphrase"
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`)
  const client = createClient(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password })
  if (signInErr) throw new Error(`signIn failed: ${signInErr.message}`)
  return { id: data.user.id, email, client }
}

async function main() {
  console.log("RLS isolation test\n")

  const a = await makeUser("a")
  const b = await makeUser("b")

  // Each user creates their own org (owner membership via SECURITY DEFINER fn).
  const { data: orgA, error: orgAErr } = await a.client.rpc("create_organization", {
    _name: "Org A",
  })
  if (orgAErr) throw new Error(`create org A: ${orgAErr.message}`)
  const { data: orgB, error: orgBErr } = await b.client.rpc("create_organization", {
    _name: "Org B",
  })
  if (orgBErr) throw new Error(`create org B: ${orgBErr.message}`)

  const orgAId = (orgA as { id: string }).id
  const orgBId = (orgB as { id: string }).id

  // User A creates a task in org A.
  const { data: taskA, error: taskAErr } = await a.client
    .from("tasks")
    .insert({ org_id: orgAId, title: "Secret A task", created_by: a.id })
    .select()
    .single()
  assert(!taskAErr && !!taskA, "user A can create a task in org A")
  if (taskAErr) console.error("    ↳ insert error:", taskAErr.message)

  console.log("\nCross-tenant READ isolation:")
  // B reads tasks → should not see A's.
  const { data: bSeesTasks } = await b.client.from("tasks").select("*")
  assert((bSeesTasks?.length ?? 0) === 0, "user B sees 0 tasks (none of A's leak)")

  // B reads org A directly.
  const { data: bSeesOrgA } = await b.client
    .from("organizations")
    .select("*")
    .eq("id", orgAId)
  assert((bSeesOrgA?.length ?? 0) === 0, "user B cannot read org A row")

  // B reads A's memberships.
  const { data: bSeesMembers } = await b.client
    .from("memberships")
    .select("*")
    .eq("org_id", orgAId)
  assert((bSeesMembers?.length ?? 0) === 0, "user B cannot read org A memberships")

  console.log("\nCross-tenant WRITE isolation:")
  // B inserts a task into org A → must fail (RLS check).
  const { error: bWriteErr } = await b.client
    .from("tasks")
    .insert({ org_id: orgAId, title: "Intruder task", created_by: b.id })
  assert(!!bWriteErr, "user B is blocked from inserting a task into org A")

  // B updates A's task → affects 0 rows.
  if (taskA) {
    const { data: bUpdated } = await b.client
      .from("tasks")
      .update({ title: "hijacked" })
      .eq("id", (taskA as { id: string }).id)
      .select()
    assert((bUpdated?.length ?? 0) === 0, "user B cannot update org A's task")
  }

  console.log("\nSanity (positive) check:")
  const { data: aSeesOwn } = await a.client.from("tasks").select("*")
  assert((aSeesOwn?.length ?? 0) === 1, "user A still sees their own task")

  // Cleanup (cascades remove orgs/tasks/memberships).
  await admin.auth.admin.deleteUser(a.id)
  await admin.auth.admin.deleteUser(b.id)
  void orgBId

  console.log("")
  if (failures > 0) {
    console.error(`✗ RLS test FAILED with ${failures} violation(s).`)
    process.exit(1)
  }
  console.log("✓ RLS test passed — no cross-tenant leakage.")
}

main().catch((err) => {
  console.error("✗ RLS test errored:", err)
  process.exit(1)
})
