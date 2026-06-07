# PLAN.md — BizOS phased build

Quality gate before ending any phase: `pnpm typecheck` (0 errors) · `pnpm lint` ·
`pnpm build` succeeds · RTL correct · dark mode · keyboard-navigable · no console
errors · RLS verified (`pnpm rls:test`).

## Phase 0 — Foundation ✅
- [x] Scaffold Next.js 16 (TS strict, App Router, Tailwind v4, Turbopack, pnpm)
- [x] shadcn/ui (radix-nova, RTL), next-themes dark mode, Heebo font, `dir="rtl"`
- [x] Design tokens: brand indigo + status/priority palettes (AA, light+dark)
- [x] Supabase migrations: full schema, indexes, RLS + `is_org_member`/`has_org_role`
- [x] `handle_new_user` + `create_organization` (SECURITY DEFINER), `updated_at` trigger
- [x] RLS isolation test script (`pnpm rls:test`)
- [x] `@supabase/ssr` clients (server/browser/admin) + session refresh in `proxy.ts`
- [x] Auth: email+password, forgot-password, `/auth/callback`; Google OAuth infra (env-gated)
- [x] Onboarding: create org → invite members → dashboard; org switcher
- [x] TanStack Query provider + reusable optimistic helper; Zustand + nuqs adapters
- [x] PWA shell (Serwist): manifest, SW (push-ready), offline fallback, icons
- [x] GitHub Actions CI (install/typecheck/lint/build)
- **Deliverable:** sign up → create org → invite a member → empty dashboard.

## Phase 1 — Tasks core
- [ ] Tasks CRUD (optimistic) · List + Board (kanban) views
- [ ] Status/priority/assignee/due dates · subtasks · drag-to-reorder (`position`)
- [ ] Projects CRUD + assign tasks · "no project" inbox · project members
- [ ] My Tasks cross-project view · quick actions (complete, inline edit, assign)

## Phase 2 — Relationships & richness
- [ ] Dependencies (blocks/blocked-by) + cycle prevention · labels · comments · attachments
- [ ] ⌘K command palette (global search) · filters + saved views (nuqs, per-user)
- [ ] Virtualized lists/boards (TanStack Virtual)

## Phase 3 — Reminders & notifications
- [ ] In-app notification center (Realtime, unread badge, mark-read)
- [ ] Web Push (VAPID, `push_subscriptions`, SW handler, send endpoint)
- [ ] iOS install + enable-notifications onboarding (16.4+, tap-triggered) · in-app fallback
- [ ] Scheduled reminders (pg_cron / Edge Function or Vercel Cron)

## Phase 4 — CRM
- [ ] Companies, contacts · pipelines + stages · deals (kanban-by-stage, optimistic drag)
- [ ] Activities linked to contact/deal/task · link tasks ↔ deals/contacts

## Phase 5 — Polish & launch readiness
- [ ] Granular permission checks (UI + RLS) · dashboard widgets
- [ ] Performance pass (LCP/INP/TTI) · a11y audit (WCAG AA) · RTL QA on real iOS/Android
