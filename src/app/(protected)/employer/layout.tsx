import { EmployerRouteGuard } from "@/lib/route-guards"
import { EmployerLayout } from "@/lib/ui/screens/jobs/employer"

export default function EmployerRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmployerRouteGuard>
      <EmployerLayout>{children}</EmployerLayout>
    </EmployerRouteGuard>
  )
}
