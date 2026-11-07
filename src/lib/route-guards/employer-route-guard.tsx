"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"

import { getPostLoginHomePath } from "@/lib/helpers/staff-home"
import { useUser } from "@/lib/providers/user"
import { CONFIG } from "@/utils/constants"
import { UserRole } from "@/utils/enums/user"

/** Employer pages: company accounts only; everyone else goes to their own home. */
export function EmployerRouteGuard({ children }: { children: ReactNode }) {
  const { userProfileInfo, profileLoaded } = useUser()
  const router = useRouter()
  const role = userProfileInfo?.role

  useEffect(() => {
    if (!profileLoaded) return
    if (!userProfileInfo) router.replace(CONFIG.ROUTES.PUBLIC.HOME)
    else if (role !== UserRole.EMPLOYER) router.replace(getPostLoginHomePath(role))
  }, [profileLoaded, userProfileInfo, role, router])

  if (!profileLoaded || !userProfileInfo || role !== UserRole.EMPLOYER) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--brand-primary) border-t-transparent" />
      </div>
    )
  }
  return <>{children}</>
}
