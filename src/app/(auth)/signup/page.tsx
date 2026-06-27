import { SignupForm } from "@/features/auth/components/signup-form"
import { safeRelativePath } from "@/lib/auth/safe-redirect"

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>
}) {
  const { redirectedFrom } = await searchParams
  return <SignupForm redirectTo={safeRelativePath(redirectedFrom)} />
}
