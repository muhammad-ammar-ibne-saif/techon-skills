import type { Metadata } from "next"

import { NOINDEX } from "@/lib/seo/metadata"
import { EmployerRouteGuard } from "@/lib/route-guards"
import { EmployerLayout } from "@/lib/ui/screens/jobs/employer"

export const metadata: Metadata = NOINDEX

export default function EmployerRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmployerRouteGuard>
      <EmployerLayout>{children}</EmployerLayout>
    </EmployerRouteGuard>
  )
}
