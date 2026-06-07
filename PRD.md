# PRD — מערכת ניהול עסק (משימות + CRM)

**שם פנימי לפרויקט:** BizOS (שם זמני — ניתן להחלפה)
**גרסה:** 1.0
**תאריך:** יוני 2026
**בעלים:** Lee Cohen / Clearlee.ai
**סטטוס:** מאושר לפיתוח (MVP)

---

## 1. תקציר מנהלים (Executive Summary)

מערכת SaaS לניהול עסק בעברית, רב‑שוכרת (multi‑tenant), המשלבת **ניהול משימות ופרויקטים** יחד עם **CRM**. כל עסק (Organization) הוא יחידת בידוד עצמאית: מנהל משתמשים, הרשאות, משימות, פרויקטים, אנשי קשר ועסקאות — בלי שום דליפת נתונים בין עסקים.

המערכת נבנית **Mobile‑first כ‑PWA** עם תאימות מלאה ל‑iOS ו‑Android, וגם חוויית דסקטופ עשירה. הדגש המרכזי: **מהירות נתפסת (perceived speed)** — כל פעולה מרגישה מיידית בזכות Optimistic UI, סנכרון חי (Realtime), וניהול state מוקפד.

**מה לא נכלל ב‑MVP:** חיובים/תשלומים (billing), אפליקציות native ל‑App Store/Play Store, אוטומציות מורכבות (workflow engine), דוחות BI מתקדמים. כולם ב‑Roadmap.

---

## 2. חזון ומטרות

### 2.1 חזון המוצר
"מקום עבודה אחד" לעסק קטן‑בינוני בישראל: צוות מנהל את העבודה (משימות/פרויקטים) ואת הלקוחות (CRM) באותה מערכת מהירה, יפה ונגישה — בעברית מלאה, ללא חיכוך.

### 2.2 מטרות מדידות (MVP)
- **זמן הפעלה (Activation):** מ‑signup ועד יצירת העסק + המשימה הראשונה — פחות מ‑3 דקות.
- **מהירות נתפסת:** כל mutation (יצירה/עדכון/השלמה) מציג שינוי ב‑UI תוך פחות מ‑100ms (אופטימי), עם reconciliation שקט מול השרת.
- **ביצועים:** LCP < 2.0s, INP < 200ms, TTI < 3s ב‑3G מהיר על מובייל.
- **נגישות:** עמידה ב‑WCAG 2.1 AA.
- **יציבות:** שגיאות לקוח (client error rate) < 0.5% מהסשנים.

### 2.3 מדדי הצלחה (KPIs לאחר השקה)
- אחוז עסקים שהוסיפו ≥2 משתמשים בשבוע הראשון.
- שימוש חוזר (WAU/MAU).
- זמן ממוצע לסגירת משימה.
- שיעור התקנת PWA למסך הבית (חשוב במיוחד ל‑iOS — תנאי ל‑push).

---

## 3. קהל יעד ופרסונות

| פרסונה | תיאור | צרכים מרכזיים |
|---|---|---|
| **בעל/ת עסק (Owner)** | מנהל/ת עסק קטן‑בינוני, פחות טכני | תמונת מצב מהירה, ניהול צוות, מעקב אחר לקוחות ועסקאות |
| **מנהל/ת צוות (Manager)** | אחראי/ת על פרויקטים וצוות | הקצאת משימות, מעקב התקדמות, תלויות בין משימות |
| **חבר/ת צוות (Member)** | מבצע/ת בשטח | רשימת המשימות שלי, תזכורות, עדכון סטטוס מהיר מהנייד |
| **אורח/ת (Guest)** | קבלן/לקוח חיצוני | גישה מוגבלת לפרויקט/משימות ספציפיים |

**הקשר תרבותי:** ממשק עברי RTL מלא, פורמטי תאריך/שעה ישראליים, שמות בעברית, תמיכה בערבוב עברית‑אנגלית בתוכן.

---

## 4. עקרונות מנחים (Product Principles)

1. **מהירות לפני הכול** — אם פעולה מרגישה איטית, היא נכשלה. Optimistic by default.
2. **פשטות מעל עושר** — פיצ'ר חדש חייב להצדיק את העומס הקוגניטיבי שהוא מוסיף.
3. **עברית כאזרח ראשון** — RTL, מספרים, תאריכים ומחרוזות מתוכננים מההתחלה, לא כתרגום בדיעבד.
4. **נגישות אינה תוספת** — מקלדת, ניגודיות, screen readers — מהיום הראשון.
5. **בידוד שוכרים קדוש** — לעולם אין דליפה בין עסקים; נאכף ברמת ה‑DB (RLS), לא רק באפליקציה.

---

## 5. השראה עיצובית — ניתוח והמלצה

המבריף ביקש השראה מ‑monday.com "או אחרים — תחשוב מה הכי עדיף". להלן הניתוח וההמלצה:

| מערכת | חוזקות | מתאים לנו? |
|---|---|---|
| **monday.com** | צבעוניות ידידותית, סטטוסים צבעוניים, נגיש ללא‑טכניים, boards | כן — לקהל SMB לא‑טכני |
| **Linear** | מהירות יוצאת דופן, command palette, מקלדת, מינימליזם מעודן, אופטימיות | כן — תקן הזהב ל"מהיר + יפה + עדין" |
| **Notion** | גמישות, מבנה חופשי | פחות — גמיש מדי, איטי יחסית, עקומת למידה |
| **Asana** | ניהול משימות נקי, תצוגות מרובות | חלקית — קצת כבד |

### ההמלצה: היברידי **Linear × monday**
- **שכבת אינטראקציה ומהירות → מ‑Linear:** Optimistic UI, command palette (⌘K), ניווט מקלדת, מינימליזם מעודן, מעברים חלקים, תחושת "כלי מקצועי קליל".
- **שפה ויזואלית ונגישות לקהל → מ‑monday:** מערכת סטטוסים צבעונית וברורה, ידידותיות, אונבורדינג מזמין, תוויות צבע, avatars.
- **התוצאה:** מערכת **מהירה ומלוטשת כמו Linear, אך נגישה וחמה כמו monday**, מותאמת לבעל עסק ישראלי שאינו מהנדס.

**שפה עיצובית קונקרטית:**
- צבע מותג ראשי + פלטת סטטוסים (לא נעשה, בתהליך, תקוע, הושלם) עם ניגודיות AA.
- טיפוגרפיה עברית מעולה (למשל *Heebo* / *Assistant* / *Rubik*), היררכיה ברורה.
- רכיבי UI מבוססי **shadcn/ui + Radix** (נגישות מובנית, RTL‑friendly) עם Tailwind.
- רדיוסים רכים, צללים עדינים, מצב כהה (dark mode) מהיום הראשון.
- אנימציות מיקרו עדינות (Framer Motion) — לתחושת תגובתיות, לא לראווה.

---

## 6. היקף (Scope)

### 6.1 כלול ב‑MVP
- אימות, הרשמה, אונבורדינג, יצירת עסק.
- רב‑שוכרות: עסקים, חברות, הזמנות, הרשאות (RBAC).
- משימות: CRUD, תצוגות List + Board (קנבן), סטטוס, עדיפות, תאריכי יעד, אחראי, תתי‑משימות.
- פרויקטים: CRUD, שיוך משימות, חברי פרויקט.
- קשרים בין משימות (תלויות: חוסם / נחסם‑ע"י).
- תוויות (labels), תגובות, קבצים מצורפים.
- חיפוש וסינון, תצוגות שמורות (saved views).
- תזכורות והתראות: In‑app + Web Push (Android/Desktop + iOS PWA מותקן).
- CRM: חברות, אנשי קשר, Pipeline ושלבים, עסקאות (deals), פעילויות, קישור בין משימות ל‑CRM.
- דשבורד "תמונת מצב".
- PWA מלא: התקנה, offline shell, רספונסיביות מושלמת.

### 6.2 מחוץ ל‑MVP (Roadmap)
- חיובים/מנויים (Stripe/Paddle).
- אפליקציות native (App Store / Play) — נשקול עטיפת Capacitor אם נדרשת גישת חומרה.
- מנוע אוטומציות (triggers/actions) — חיבור עתידי ל‑n8n.
- דוחות/BI מתקדמים, ייצוא, אינטגרציות (WhatsApp, אימייל, יומן).
- אורחים חיצוניים מתקדמים, audit log מלא ב‑UI.

---

## 7. דרישות פונקציונליות

### 7.1 אימות ואונבורדינג
- הרשמה/התחברות: אימייל+סיסמה, **Magic Link**, ואופציונלי Google OAuth.
- אונבורדינג: יצירת עסק (שם, לוגו אופציונלי) → הזמנת חברי צוות → יצירת פרויקט/משימה ראשונה.
- שחזור סיסמה, אימות אימייל.
- ניהול סשן מאובטח (cookies, refresh במידלוור).

### 7.2 רב‑שוכרות וניהול עסק
- משתמש יכול להשתייך למספר עסקים ולעבור ביניהם (org switcher).
- כל עסק: שם, slug, לוגו, הגדרות (locale, אזור זמן, מטבע).
- הזמנת משתמשים באימייל עם token, קבלה/דחייה, תפוגה.

### 7.3 הרשאות (RBAC)
תפקידים ברירת מחדל:

| תפקיד | יכולות |
|---|---|
| **Owner** | הכול, כולל מחיקת עסק, ניהול חיובים (עתידי) |
| **Admin** | ניהול משתמשים והרשאות, הגדרות עסק, כל הנתונים |
| **Manager** | יצירה/עריכה של פרויקטים ומשימות, הקצאות, ניהול CRM |
| **Member** | עבודה על משימות שהוקצו, יצירת משימות, צפייה |
| **Guest** | גישה לקריאה/עדכון מוגבל לפרויקטים ספציפיים בלבד |

- מטריצת הרשאות נאכפת **גם ב‑UI וגם ב‑RLS** (Row Level Security) ב‑DB.
- ארכיטקטורה ניתנת להרחבה להרשאות גרנולריות בעתיד (permissions per resource).

### 7.4 משימות (Tasks)
- שדות: כותרת, תיאור (rich text בסיסי), סטטוס, עדיפות, אחראי, יוצר, תאריך התחלה/יעד, תוויות, פרויקט, משימת‑אב (subtask), סדר (drag‑to‑reorder).
- תצוגות: **List**, **Board (קנבן)**, ובהמשך לוח שבועי/לוח שנה.
- פעולות מהירות: השלמה בקליק, עריכה inline, הקצאה מהירה, drag & drop בין עמודות/סדר.
- **Optimistic updates** בכל פעולה.
- **My Tasks** — תצוגה אישית של המשימות שלי לרוחב כל הפרויקטים.

### 7.5 פרויקטים (Projects)
- שדות: שם, תיאור, סטטוס, צבע, בעלים, חברי פרויקט, תאריכים, ארכוב.
- שיוך משימות לפרויקט; משימה יכולה גם להיות "ללא פרויקט" (Inbox).
- בקרת גישה ברמת הפרויקט (project members).

### 7.6 קשרים ותלויות
- **תלויות בין משימות:** "חוסם" / "נחסם ע"י", עם מניעת מעגלים (cycle detection).
- **תתי‑משימות:** היררכיה (parent_task_id), חישוב התקדמות.
- **קישור משימה ל‑CRM:** קישור משימה לעסקה (deal) או לאיש קשר.

### 7.7 תזכורות והתראות
- **תזכורות:** מבוססות זמן על משימה (remind_at), אישיות.
- **התראות In‑app:** מרכז התראות, badge, סנכרון Realtime, סימון כנקרא.
- **Web Push:**
  - **Android / Desktop:** תמיכה מלאה.
  - **iOS:** רק כש‑PWA **מותקן למסך הבית** (iOS 16.4+), וה‑prompt חייב להיות **מופעל ע"י מגע** (כפתור "הפעל התראות"). אין Background Sync.
  - **Fallback:** התראות in‑app תמיד עובדות; לפריטים קריטיים — מסלול אימייל (Roadmap).
  - **אונבורדינג ייעודי ל‑iOS:** באנר/מסך שמסביר "הוסף למסך הבית → הפעל התראות".
- שליחה: מתוזמנת דרך Supabase `pg_cron` + Edge Function (או Vercel Cron) שבודקת תזכורות שהבשילו ושולחת Push/In‑app.

### 7.8 CRM
- **חברות (Companies):** שם, דומיין, תחום, גודל, הערות.
- **אנשי קשר (Contacts):** שם, אימייל, טלפון, תפקיד, חברה, בעלים.
- **Pipeline ושלבים:** ניתן להגדרה (שם, סדר, הסתברות).
- **עסקאות (Deals):** כותרת, ערך, מטבע, שלב, איש קשר/חברה, בעלים, תאריך סגירה צפוי, סטטוס (open/won/lost). תצוגת **Kanban לפי שלבים**.
- **פעילויות (Activities):** שיחה/פגישה/אימייל/הערה, מקושרות לאיש קשר/עסקה/משימה.
- **קישור דו‑כיווני** בין CRM למשימות (משימה הנובעת מעסקה).

### 7.9 דשבורד וחיפוש
- **דשבורד:** המשימות שלי להיום, תזכורות קרובות, עסקאות פתוחות לפי שלב, פעילות אחרונה.
- **חיפוש גלובלי:** דרך command palette (⌘K) — משימות, פרויקטים, אנשי קשר, עסקאות.
- **סינון ותצוגות שמורות:** סטטוס/אחראי/תווית/תאריך, מסונכרן ל‑URL (shareable) ושמור per‑user.

---

## 8. דרישות לא‑פונקציונליות

### 8.1 ביצועים ומהירות נתפסת
- **Optimistic UI** בכל mutation; reconciliation שקט.
- **Realtime** (Supabase Realtime) לעדכון חי של רשימות/לוחות בין משתמשים.
- **Virtualization** (TanStack Virtual) לרשימות/לוחות גדולים.
- Server Components + streaming לטעינה ראשונית מהירה; prefetch של ניווט.
- אינדקסים ב‑DB על `org_id`, `status`, `assignee_id`, `due_date`, `project_id`.

### 8.2 רספונסיביות
- **Mobile‑first**, breakpoints מלאים עד desktop רחב.
- מובייל: ניווט תחתון, מסכים מלאים, מחוות (swipe, pull‑to‑refresh), אזורי מגע ≥44px.
- דסקטופ: sidebar, multi‑pane, קיצורי מקלדת מלאים.
- בדיקה על iOS Safari ו‑Android Chrome אמיתיים, לא רק אמולטור.

### 8.3 RTL ובינלאומיות
- כיווניות RTL מלאה (logical CSS properties: `inline-start/end`).
- מספרים, תאריכים, מטבע בפורמט ישראלי.
- מבנה מוכן ל‑i18n עתידי (אנגלית), גם אם MVP בעברית בלבד.

### 8.4 נגישות (WCAG 2.1 AA)
- ניווט מקלדת מלא, focus states ברורים, ARIA נכון (Radix מספק בסיס).
- ניגודיות צבעים AA, תמיכה ב‑prefers‑reduced‑motion ו‑dark mode.

### 8.5 אבטחה ופרטיות
- **RLS על כל טבלה** — בידוד מוחלט לפי `org_id`.
- אימות הרשאות בצד שרת בכל פעולה רגישה (לא רק בלקוח).
- ולידציה עם Zod בכל קלט (client + server).
- ניהול secrets ב‑Vercel/Supabase env; אין מפתחות בקוד.
- מדיניות פרטיות בסיסית, מחיקת חשבון/עסק (Roadmap מלא).

### 8.6 PWA ו‑Offline
- Service worker (Serwist), manifest, אייקונים, התקנה.
- Offline shell: המסכים נטענים, מצב לא‑מקוון מוצג בבירור.
- **מגבלות iOS שיש לתכנן סביבן:** אין Background Sync/Fetch; push רק ב‑PWA מותקן; מכסות אחסון מצומצמות יותר מ‑Chrome.

---

## 9. ארכיטקטורה וסטאק טכנולוגי

```
┌─────────────────────────────────────────────────────────┐
│  Client (PWA)  —  Next.js 16 App Router + React 19        │
│  • Server Components (טעינה ראשונית, streaming)            │
│  • TanStack Query v5 (server state + optimistic)          │
│  • Zustand (UI state) + nuqs (URL state)                  │
│  • shadcn/ui + Radix + Tailwind (RTL, a11y)               │
│  • Serwist (service worker, push, offline)                │
└───────────────┬─────────────────────────────────────────┘
                │  @supabase/ssr (cookies, RLS)
┌───────────────▼─────────────────────────────────────────┐
│  Supabase                                                 │
│  • Postgres + RLS (multi-tenant)                          │
│  • Auth (email, magic link, OAuth)                        │
│  • Realtime (live sync)                                   │
│  • Storage (attachments, avatars)                         │
│  • Edge Functions + pg_cron (reminders, push dispatch)    │
└───────────────────────────────────────────────────────────┘

Hosting: Vercel (Next.js)  |  Source/CI: GitHub + Actions
Push: Web Push API (VAPID) דרך service worker
```

**בחירות מפתח ונימוקים:**
- **Next.js 16 + React 19** — הגרסה היציבה הנוכחית; 15 מגיע ל‑EOL ב‑10/2026.
- **Supabase** — Auth+DB+Realtime+Storage באחד, ו‑RLS הוא הבסיס לבידוד שוכרים.
- **TanStack Query** — תקן הזהב ל‑server state עם optimistic updates → המהירות הנתפסת.
- **Serwist** במקום next‑pwa — מתוחזק פעיל ומותאם ל‑App Router.
- **shadcn/ui + Radix** — נגישות ו‑RTL מובנים, בעלות על הקוד, ללא נעילה.

---

## 10. מודל נתונים (ברמת תכן)

> כל הטבלאות (למעט `profiles`) כוללות `org_id` ונאכפות ב‑RLS.

**ליבה / שוכרות**
- `organizations` (id, name, slug, settings, plan, created_at)
- `profiles` (id=auth.users.id, full_name, avatar_url, locale, phone)
- `memberships` (id, org_id, user_id, role, status) — unique(org_id, user_id)
- `invitations` (id, org_id, email, role, token, expires_at, accepted_at)

**משימות ופרויקטים**
- `projects` (id, org_id, name, description, status, color, owner_id, dates, archived_at)
- `project_members` (project_id, user_id, role)
- `tasks` (id, org_id, project_id?, parent_task_id?, title, description, status, priority, assignee_id, created_by, start_date, due_date, position, completed_at)
- `task_dependencies` (id, org_id, predecessor_task_id, successor_task_id, type)
- `labels` (id, org_id, name, color) + `task_labels` (task_id, label_id)
- `task_comments` (id, org_id, task_id, author_id, body)
- `attachments` (id, org_id, task_id?, storage_path, file_name, mime, size, uploaded_by)

**תזכורות והתראות**
- `reminders` (id, org_id, user_id, task_id?, remind_at, message, status)
- `notifications` (id, org_id, user_id, type, title, body, entity_type, entity_id, read_at)
- `push_subscriptions` (id, user_id, endpoint, p256dh, auth, user_agent)

**CRM**
- `crm_companies` (id, org_id, name, domain, industry, notes)
- `crm_contacts` (id, org_id, company_id?, first_name, last_name, email, phone, title, owner_id)
- `crm_pipelines` (id, org_id, name) + `crm_stages` (id, org_id, pipeline_id, name, position, probability)
- `crm_deals` (id, org_id, pipeline_id, stage_id, contact_id?, company_id?, title, value, currency, owner_id, expected_close_date, status)
- `crm_activities` (id, org_id, type, contact_id?, deal_id?, task_id?, note, occurred_at, created_by)

**ביקורת**
- `audit_log` (id, org_id, actor_id, action, entity_type, entity_id, diff, created_at)

**דפוס RLS (לכל טבלה עם org_id):**
```sql
-- חברות פעילה בעסק
create policy "members read" on <table>
  for select using (
    org_id in (select org_id from memberships
               where user_id = auth.uid() and status = 'active')
  );
-- כתיבה: בנוסף בדיקת תפקיד מתאים
```

---

## 11. תוכנית פיתוח (Phased Roadmap)

| שלב | תוכן | תוצר מוחשי |
|---|---|---|
| **Phase 0 — תשתית** | Scaffolding, Auth, עסק+חברות, בסיס RLS, Design System, RTL, מעטפת PWA, CI | משתמש נרשם, יוצר עסק, מזמין חבר צוות |
| **Phase 1 — משימות ליבה** | Tasks CRUD, List+Board, סטטוס/עדיפות/אחראי/יעד, תתי‑משימות, Optimistic, פרויקטים, My Tasks | זרימת ניהול משימות מלאה |
| **Phase 2 — קשרים ועושר** | תלויות (+מניעת מעגלים), תוויות, תגובות, קבצים, חיפוש ⌘K, סינון ותצוגות שמורות | עבודת צוות עשירה |
| **Phase 3 — תזכורות/התראות** | In‑app + Realtime, Web Push (VAPID), אונבורדינג iOS, תזכורות מתוזמנות | המשתמש מקבל תזכורות והתראות |
| **Phase 4 — CRM** | חברות, אנשי קשר, Pipeline/Deals (Kanban), פעילויות, קישור למשימות | ניהול לקוחות ועסקאות |
| **Phase 5 — ליטוש** | הרשאות גרנולריות, דשבורד/אנליטיקה, מעבר ביצועים, audit נגישות AA | מוכן להשקה |

---

## 12. סיכונים והנחות

| סיכון | השפעה | הפחתה |
|---|---|---|
| מגבלות PWA ב‑iOS (push, background) | חוסר התראות למשתמשי iOS שלא התקינו | אונבורדינג להתקנה + fallback in‑app/אימייל; שקילת Capacitor בעתיד |
| מורכבות RLS רב‑שוכרת | באג = דליפת נתונים | בדיקות אוטומטיות ל‑RLS, helper functions, סקירת אבטחה ייעודית |
| היקף רחב (משימות+CRM) | זחילת היקף | פיתוח מדורג עם review בין שלבים; MVP ממוקד |
| RTL + רכיבי צד ג' | באגי כיווניות | בחירת ספריות RTL‑friendly (Radix), QA ייעודי ל‑RTL |
| Optimistic UI מורכב | מצבי כשל לא עקביים | תבנית אחידה ל‑optimistic + rollback ב‑TanStack Query |

**הנחות:** קהל היעד הראשוני בישראל (לא EU — אין מגבלת iOS PWA של ה‑EU); נפח התחלתי קטן‑בינוני; אין צורך ב‑native ל‑MVP; שפת ממשק עברית בלבד ב‑MVP.

---

*מסמך זה הוא בסיס חי. שינויי היקף יתועדו בגרסאות.*
