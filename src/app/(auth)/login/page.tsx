import { LoginForm } from "@/features/auth/components/login-form"
import { safeRelativePath } from "@/lib/auth/safe-redirect"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>
}) {
  const { redirectedFrom } = await searchParams
  return <LoginForm redirectTo={safeRelativePath(redirectedFrom)} />
}
