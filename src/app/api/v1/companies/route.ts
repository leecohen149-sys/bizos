import { makeCollectionRoute } from "@/lib/api/resource-handler"
import { RESOURCES } from "@/lib/api/resources"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const { GET, POST } = makeCollectionRoute(RESOURCES.companies)
