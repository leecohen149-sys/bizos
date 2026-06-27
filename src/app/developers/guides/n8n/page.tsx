import Link from "next/link"

export const metadata = { title: "חיבור BizOS ל-n8n — מדריך" }

const codeCls =
  "block whitespace-pre overflow-x-auto rounded-lg bg-muted p-4 text-sm font-mono text-foreground my-3"

export default function N8nGuidePage() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-6 py-12 leading-relaxed">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/developers" className="underline">
          ← תיעוד API
        </Link>
        <span className="mx-2">·</span>
        <Link href="/developers/guides/make" className="underline">
          מדריך Make
        </Link>
      </nav>

      <h1 className="mb-2 text-3xl font-bold">חיבור BizOS ל-n8n</h1>
      <p className="mb-8 text-muted-foreground">
        תוך 5 דקות תוכלו לקרוא ולכתוב נתונים (לידים, אנשי קשר, עסקאות, משימות) מ-n8n,
        ולקבל אירועים בזמן אמת דרך Webhooks.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">1. יצירת מפתח API</h2>
      <p>
        ב-BizOS היכנסו ל-<strong>הגדרות ← אינטגרציות</strong>, צרו מפתח חדש והעתיקו אותו
        (מוצג פעם אחת בלבד). המפתח נראה כך: <code>bizos_live_…</code>
      </p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">2. הגדרת Credential ב-n8n</h2>
      <p>
        ב-n8n הוסיפו צומת <strong>HTTP Request</strong>. תחת{" "}
        <em>Authentication → Generic Credential Type → Header Auth</em> (או{" "}
        <em>Bearer Auth</em>) הגדירו:
      </p>
      <code className={codeCls}>{`Name:  Authorization
Value: Bearer bizos_live_xxxxxxxxxxxxxxxx`}</code>

      <h2 className="mb-3 mt-8 text-xl font-semibold">3. קריאת נתונים</h2>
      <p>שלחו בקשת GET. דוגמה — שליפת עסקאות:</p>
      <code className={codeCls}>{`GET https://bizos-delta.vercel.app/api/v1/deals
Headers: Authorization: Bearer bizos_live_…`}</code>
      <p>
        התשובה היא <code>{`{ "data": [...], "meta": { "next_cursor": "...", "has_more": true } }`}</code>.
        ל-pagination השתמשו ב-<strong>Pagination</strong> של צומת ה-HTTP Request: מצב{" "}
        <em>Response Contains Next URL</em> אינו נדרש — פשוט העבירו את{" "}
        <code>meta.next_cursor</code> כפרמטר <code>cursor</code> בבקשה הבאה כל עוד{" "}
        <code>has_more = true</code>.
      </p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">4. Polling — רק מה שהשתנה</h2>
      <p>
        כדי לסרוק רק רשומות שהשתנו, הוסיפו <strong>Schedule Trigger</strong> ובצומת ה-HTTP
        העבירו פרמטר <code>updated_since</code> עם חותמת הזמן של הריצה הקודמת:
      </p>
      <code className={codeCls}>{`GET /api/v1/contacts?updated_since=2026-06-01T00:00:00Z`}</code>
      <p>הרשומות מוחזרות מהישנה לחדשה — שמרו את ה-<code>updated_at</code> האחרון לריצה הבאה.</p>

      <h2 className="mb-3 mt-8 text-xl font-semibold">5. יצירה / עדכון</h2>
      <code className={codeCls}>{`POST /api/v1/contacts
{ "first_name": "דנה", "last_name": "לוי", "email": "dana@acme.co" }

PATCH /api/v1/deals/<id>
{ "status": "won" }`}</code>

      <h2 className="mb-3 mt-8 text-xl font-semibold">6. יצירת עסקה עם השלב הנכון</h2>
      <p>
        ליצירת עסקה (<code>POST /api/v1/deals</code>) צריך <code>stage_id</code> — מזהה השלב
        (העמודה) בלוח. כדי למצוא אותו לפי שם, שלפו תחילה את רשימת השלבים:
      </p>
      <code className={codeCls}>{`GET /api/v1/stages
Headers: Authorization: Bearer bizos_live_…

// תשובה: { "data": [ { "id", "name", "position", "pipeline_id", ... } ] }
// ממוין לפי pipeline_id ואז position (העמודה הראשונה = position הנמוך ביותר).`}</code>
      <p>
        בחרו את ה-<code>id</code> של השלב המתאים (לפי <code>name</code> או <code>position</code>)
        וצרו את העסקה — <code>pipeline_id</code> נגזר אוטומטית מ-<code>stage_id</code>:
      </p>
      <code className={codeCls}>{`POST /api/v1/deals
{ "title": "לי בדיקה 1", "value": 0, "stage_id": "<id מהשלב>", "contact_id": "<id מאיש הקשר>" }`}</code>

      <h2 className="mb-3 mt-8 text-xl font-semibold">7. Webhooks (Real-time)</h2>
      <p>
        בצעו <em>Add Webhook node</em> ב-n8n, העתיקו את ה-URL שלו, וב-BizOS תחת{" "}
        <strong>הגדרות ← אינטגרציות ← Webhooks</strong> רשמו אותו עם האירועים הרצויים (למשל{" "}
        <code>deal.created</code>, <code>deal.updated</code>). כל אירוע נשלח כ-POST חתום ב-HMAC:
      </p>
      <code className={codeCls}>{`X-Bizos-Signature: <hex>
X-Bizos-Timestamp: <unix seconds>
X-Bizos-Event-Id:  <uuid>   // למניעת כפילויות

// אימות (Node):
const expected = crypto.createHmac('sha256', SECRET)
  .update(timestamp + '.' + rawBody).digest('hex')`}</code>
      <p className="mt-6 text-sm text-muted-foreground">
        סקירת כל ה-endpoints והרצת בקשות לדוגמה:{" "}
        <Link href="/developers" className="underline">
          תיעוד ה-API האינטראקטיבי
        </Link>
        .
      </p>
    </main>
  )
}
