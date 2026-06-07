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

## Phase 1 — Tasks core ✅
- [x] Tasks CRUD (optimistic) · List + Board (kanban) views
- [x] Status/priority/assignee/due dates · subtasks · drag-to-reorder (`position`)
- [x] Projects CRUD + assign tasks · "no project" inbox
- [x] My Tasks cross-project view · quick actions (complete, inline edit, assign)

## Phase 2 — Relationships & richness ✅
- [x] Dependencies (blocks/blocked-by) + DB cycle prevention · labels · comments · attachments
- [x] ⌘K command palette (global search) · filters + saved views (nuqs + localStorage)
- [x] Virtualized list (TanStack Virtual)

## Phase 3 — Reminders & notifications ✅
- [x] In-app notification center (Realtime, unread badge, mark-read) + assignment trigger
- [x] Web Push (VAPID, `push_subscriptions`, SW handler, /api/push/send)
- [x] iOS install + enable-notifications onboarding (16.4+, tap-triggered) · in-app fallback
- [x] Scheduled reminders (Vercel Cron → /api/cron/reminders)

## Phase 4 — CRM ✅
- [x] Companies, contacts · default pipeline + stages · deals (kanban-by-stage, optimistic drag)
- [x] Activities linked to deals/contacts

## Phase 5 — Polish & launch readiness ✅
- [x] Permission gating (UI `useCanManage` + role-gated RLS) · members management + invites
- [x] Dashboard widgets (my tasks today, upcoming reminders, open deals by stage, recent activity)
- [x] a11y: skip link, focus states, RTL logical props, AA tokens, reduced-motion
- [ ] Remaining: real-device iOS/Android QA, Lighthouse perf budgets (manual)
