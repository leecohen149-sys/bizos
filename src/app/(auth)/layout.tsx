import Link from "next/link"

import { Logo } from "@/components/brand/logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="BizOS">
            <Logo />
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
