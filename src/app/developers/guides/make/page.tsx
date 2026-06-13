import Link from "next/link"

export const metadata = { title: "חיבור BizOS ל-Make — מדריך" }

const codeCls =
  "block whitespace-pre overflow-x-auto rounded-lg bg-muted p-4 text-sm font-mono text-foreground my-3"

export default function MakeGuidePage() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-6 py-12 leading-relaxed">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/developers" className="underline">
          ← תיעוד API
        </Link>
        <span className="mx-2">·</span>
        <Link href="/developers/guides/n8n" className="underline">
          מדריך n8n
        </Link>
      </nav>

      <h1 className="mb-2 text-3xl font-bold">חיבור BizOS ל-Make</h1>
      <p className="mb-8 text-muted-foreground">
        עבודה מול BizOS ב-Make.com דרך מודול ה-HTTP, כולל טריגרים מיידיים (Webhooks).
      </p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">1. יצירת מפתח API</h2>
      <p>
        ב-BizOS: <strong>הגדרות ← אינטגרציות ← צור מפתח</strong>. העתיקו את{" "}
        <code>bizos_live_…</code> (מוצג פעם אחת).
      </p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">2. מודול HTTP</h2>
      <p>
        הוסיפו את המודול <strong>HTTP → Make a request</strong>. הגדירו כותרת:
      </p>
      <code className={codeCls}>{`Method: GET
URL:    https://bizos-delta.vercel.app/api/v1/deals
Headers:
  Authorization: Bearer bizos_live_…`}</code>
      <p>
        סמנו <em>Parse response</em> כדי ש-Make יפרק את ה-JSON. הרשומות נמצאות תחת{" "}
        <code>data[]</code>.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">3. עימוד (Pagination)</h2>
      <p>
        השתמשו ב-<code>meta.next_cursor</code> מהתשובה כפרמטר <code>cursor</code> בקריאה
        הבאה, כל עוד <code>meta.has_more = true</code> (אפשר עם <em>Repeater</em> /{" "}
        <em>Iterator</em>).
      </p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">4. סנכרון מצטבר</h2>
      <code className={codeCls}>{`GET /api/v1/contacts?updated_since=2026-06-01T00:00:00Z`}</code>
      <p>מחזיר רק רשומות שהשתנו מאז, מהישנה לחדשה — מושלם ל-Scheduled scenario.</p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">5. יצירה / עדכון</h2>
      <code className={codeCls}>{`POST /api/v1/deals
Body (Raw / application/json):
{ "title": "עסקה חדשה", "value": 5000, "stage_id": "<uuid>" }`}</code>

      <h2 className="mb-3 mt-8 text-xl font-semibold">6. טריגר מיידי (Webhook)</h2>
      <p>
        צרו <strong>Custom Webhook</strong> ב-Make, העתיקו את ה-URL, וב-BizOS רשמו אותו תחת{" "}
        <strong>הגדרות ← אינטגרציות ← Webhooks</strong> עם האירועים (<code>deal.created</code> וכו׳).
        כל קריאה כוללת חתימת HMAC לאימות:
      </p>
      <code className={codeCls}>{`X-Bizos-Signature, X-Bizos-Timestamp, X-Bizos-Event-Id
expected = HMAC_SHA256(secret, timestamp + '.' + rawBody)`}</code>

      <h2 className="mb-3 mt-8 text-xl font-semibold">7. ייבוא אוטומטי של ה-API</h2>
      <p>
        ב-Make אפשר לייבא את מפרט ה-OpenAPI שלנו (לבניית מודולים מהירה):
      </p>
      <code className={codeCls}>{`https://bizos-delta.vercel.app/api/openapi.json`}</code>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/developers" className="underline">
          לתיעוד ה-API האינטראקטיבי המלא ←
        </Link>
      </p>
    </main>
  )
}
