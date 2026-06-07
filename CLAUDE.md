# CLAUDE.md — BizOS

Multi-tenant Hebrew (RTL) business-management SaaS: task/project management + CRM.
Mobile-first PWA. Aesthetic: Linear's speed × monday.com's friendly color-coding.

## Stack

- **Next.js 16** (App Router, React 19, TS strict, **Turbopack**) · `pnpm`
- **Supabase** — Postgres + RLS, Auth, Realtime, Storage, Edge Functions (`@supabase/ssr`)
- **TanStack Query v5** (server state + optimistic) · **Zustand** (UI state) · **nuqs** (URL state)
- **React Hook Form + Zod** (schemas shared client/server)
- **Tailwind v4 + shadcn/ui** (radix-nova style, RTL on) · `lucide-react` · `framer-motion`
- **@dnd-kit** (task/deal kanban drag) · **@tanstack/react-virtual** (long lists) · `date-fns` (he locale)
- **Serwist** (`@serwist/next`) PWA · **web-push** (VAPID) · **Heebo** font

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
  All list hooks live in `features/*/hooks.ts`; the browser client is `useSupabase()`
  (in `features/tasks/hooks.ts`) and the active org/members come from `useOrg()`
  (`features/org/org-context.tsx`, provided by the `(app)` layout).
- **Realtime:** subscribe per org/user with `supabase.channel(...).on('postgres_changes', …)`
  and invalidate the matching query key (see tasks/comments/notifications/deals hooks).
- **Kanban:** `@dnd-kit` columns; on drop compute `position` as the midpoint of
  neighbors and mutate `{status|stage_id, position}` optimistically.
- **Folders:** feature-based — `features/{auth,org,tasks,projects,crm,notifications,reminders,labels,search,dashboard}`,
  shared `components/ui`, `lib/{supabase,query,constants,validations,store,push}`.

## DB / migration gotchas (learned the hard way)

- `gen_random_bytes` lives in the **`extensions`** schema → call `extensions.gen_random_bytes(...)`.
- New tables need explicit **grants** to `authenticated` (RLS alone isn't enough) — see
  `…_grants.sql`. Default privileges cover future tables.
- For Realtime, add tables to the publication: `alter publication supabase_realtime add table …`.
- Forms: never put Zod `.default()` on a field used with `zodResolver` + `useForm<Output>`
  (input/output type mismatch). Set defaults in `defaultValues` instead. For numeric
  inputs use `z.number()` + manual `Number(e.target.value)` (not `z.coerce`).
- After adding an RPC/migration, run `pnpm db:types` before typechecking.
- The service worker (`app/sw.ts`) is **excluded** from `tsconfig` (webworker vs dom libs)
  and from ESLint; Serwist compiles it during the webpack build.
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
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | web push |
| `PUSH_SECRET` | guards `/api/push/send` |
| `CRON_SECRET` | Bearer auth for `/api/cron/reminders` (Vercel cron) |

## Deployment

- **Live:** https://bizos-delta.vercel.app — Vercel project `leecohen149-s-projects/bizos`.
- **GitHub → Vercel auto-deploy is connected:** pushing to `main` deploys to production.
  (Manual CLI deploy still works: `unset VERCEL_ORG_ID VERCEL_PROJECT_ID` first — the empty
  `VERCEL_PROJECT_ID` in `.env.local` conflicts with the linked `.vercel/project.json` —
  then `pnpm exec vercel deploy --prod --token $VERCEL_TOKEN`.)
- **Build command on Vercel:** `pnpm build` (set in `vercel.json`) so the `--webpack` flag is used.
- **Reminders cron:** Hobby plan allows **once/day** only → `vercel.json` uses `0 8 * * *`.
  For finer cadence, upgrade to Pro or hit `/api/cron/reminders` from an external scheduler
  with `Authorization: Bearer $CRON_SECRET`.
- Prod env vars live in the Vercel project; Supabase Auth `site_url` + redirect allow-list
  include the prod domain (set via the Management API).
- CI (`.github/workflows/ci.yml`) is **local-only/gitignored** until the GitHub token has
  `workflow` scope.

## Status

**Phases 0–5 complete and deployed.** Full feature set: auth/RLS, tasks (list+kanban,
subtasks, deps, labels, comments, attachments, reminders), projects, ⌘K search, filters +
saved views, in-app notifications + web push, CRM (deals kanban, contacts, companies,
activities), dashboard widgets, members/roles + invites. Quality gate
(typecheck/lint/build/`pnpm rls:test`) green. See `PLAN.md` for the per-phase checklist.
