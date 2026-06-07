# CLAUDE.md — BizOS

Multi-tenant Hebrew (RTL) business-management SaaS: task/project management + CRM.
Mobile-first PWA. Aesthetic: Linear's speed × monday.com's friendly color-coding.

## Stack

- **Next.js 16** (App Router, React 19, TS strict, **Turbopack**) · `pnpm`
- **Supabase** — Postgres + RLS, Auth, Realtime, Storage, Edge Functions (`@supabase/ssr`)
- **TanStack Query v5** (server state + optimistic) · **Zustand** (UI state) · **nuqs** (URL state)
- **React Hook Form + Zod** (schemas shared client/server)
- **Tailwind v4 + shadcn/ui** (radix-nova style, RTL on) · `lucide-react` · `framer-motion`
- **Serwist** (`@serwist/next`) PWA · **web-push** (VAPID, Phase 3) · **Heebo** font

## Commands

| Command | What |
|---|---|
| `pnpm dev` | Dev server (Turbopack; SW disabled in dev) |
| `pnpm build` | Prod build — **uses `--webpack`** (Serwist needs webpack; Turbopack rejects it) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (flat config) |
| `pnpm format` | Prettier write |
| `pnpm db:push` | Apply migrations to linked Supabase project |
| `pnpm db:types` | Regenerate `src/lib/supabase/database.types.ts` |
| `pnpm rls:test` | Cross-tenant RLS isolation test (against linked project) |

## Conventions

- **RTL-first.** `<html lang="he" dir="rtl">`. Use **logical** Tailwind props only
  (`ps-/pe-/ms-/me-/start-/end-`) — never raw `left/right`.
- **Next 16 specifics:** middleware is **`proxy.ts`** (nodejs runtime, no edge);
  `cookies()`/`headers()`/`params`/`searchParams` are **async** (await them).
- **Multi-tenant:** every domain table (except `profiles`) carries `org_id`.
  Isolation is enforced in the DB via **RLS**, not app code. Helpers:
  `is_org_member(org)`, `has_org_role(org, roles[])` (SECURITY DEFINER).
- **Supabase clients:** `lib/supabase/server.ts` (cookies), `client.ts` (browser),
  `admin.ts` (service-role, server-only), `middleware.ts` (session refresh in proxy).
- **Optimistic mutations:** one helper — `lib/query/optimistic.ts`
  (`onMutate→cancel→snapshot→patch / onError rollback / onSettled invalidate`).
  Query keys via `queryKeys` factory.
- **Folders:** feature-based — `features/{auth,org,tasks,projects,crm,notifications}`,
  shared `components/ui`, `lib/{supabase,query,constants,validations,store}`.
- **Design tokens:** brand indigo `--primary`; status palette `--color-status-*`
  (not_started/in_progress/blocked/done) + priority palette, AA contrast, light+dark.
  Hebrew labels + class maps in `lib/constants/domain.ts`.
- Validate every input with Zod on **both** client and server. Re-check authz
  server-side for sensitive actions.

## Env vars (see `.env.example`)

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only, bypasses RLS |
| `NEXT_PUBLIC_APP_URL` | auth redirects / invite links |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | `"true"` to show Google buttons (infra ready) |
| `SUPABASE_ACCESS_TOKEN` | CLI: link, gen types (dev only) |
| `VAPID_*` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Phase 3 web push |

## Status

Phase 0 (Foundation) complete. See `PLAN.md` for the phased roadmap.
