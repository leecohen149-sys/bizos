import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getActiveOrg } from "@/features/org/queries"
import { ADMIN_ROLES } from "@/lib/constants/domain"
import { ApiKeysView } from "@/features/integrations/components/api-keys-view"
import { WebhooksView } from "@/features/integrations/components/webhooks-view"

export const metadata = { title: "אינטגרציות" }

export default async function IntegrationsPage() {
  const org = await getActiveOrg()
  if (!org) redirect("/onboarding")
  if (!ADMIN_ROLES.includes(org.role)) redirect("/")

  const supabase = await createClient()

  // Never select key_hash — only display-safe columns.
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })

  const { data: endpoints } = await supabase
    .from("webhook_endpoints")
    .select("id, url, secret, events, is_active, description, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })

  const { data: deliveries } = await supabase
    .from("webhook_deliveries")
    .select("id, endpoint_id, event_type, status, attempts, last_status_code, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">אינטגרציות ואוטומציות</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          חברו את BizOS ל-n8n, Make ו-Zapier דרך מפתחות API ו-Webhooks.{" "}
          <a href="/developers" target="_blank" className="text-primary underline">
            תיעוד ה-API
          </a>
        </p>
      </div>

      <ApiKeysView keys={keys ?? []} />
      <WebhooksView endpoints={endpoints ?? []} deliveries={deliveries ?? []} />
    </div>
  )
}
