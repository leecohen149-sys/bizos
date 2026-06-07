import { redirect } from "next/navigation"

import { Logo } from "@/components/brand/logo"
import { getUserOrgs } from "@/features/org/queries"
import { OnboardingWizard } from "@/features/org/components/onboarding-wizard"

export const metadata = { title: "התחלה" }

export default async function OnboardingPage() {
  // Already has an org → straight to the app.
  const orgs = await getUserOrgs()
  if (orgs.length > 0) redirect("/")

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <OnboardingWizard />
      </div>
    </div>
  )
}
