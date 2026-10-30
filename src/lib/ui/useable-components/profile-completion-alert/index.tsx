"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserRoundPenIcon, XIcon } from "lucide-react"

import { useUser } from "@/lib/providers/user"
import { Button } from "@/lib/ui/useable-components/button"
import { CONFIG } from "@/utils/constants"
import { UserRole } from "@/utils/enums/user"

const DISMISS_KEY = CONFIG.STORAGE_KEYS.SESSION.PROFILE_ALERT_DISMISSED

function readDismissed(): boolean {
  try {
    return typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1"
  } catch {
    return false
  }
}

/**
 * Reminds students to fill in the profile fields they left empty (name, phone, photo).
 * "Later" hides it until the browser tab is closed; it disappears for good once the profile is complete.
 */
export function ProfileCompletionAlert() {
  const { userProfileInfo } = useUser()
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(readDismissed)

  if (!userProfileInfo || userProfileInfo.role !== UserRole.STUDENT) return null
  if (dismissed || pathname === CONFIG.ROUTES.STUDENT.PROFILE) return null

  const missing = [
    !userProfileInfo.fullName?.trim() && "full name",
    !userProfileInfo.phoneNumber?.trim() && "phone number",
    !userProfileInfo.profilePicture?.trim() && "profile photo",
  ].filter((m): m is string => Boolean(m))
  if (!missing.length) return null

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore private mode */
    }
    setDismissed(true)
  }

  const list =
    missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center"
    >
      <UserRoundPenIcon className="size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">Complete your profile</div>
        <div className="text-muted-foreground">
          Please add your {list} so instructors and the admin team can recognise and contact you.
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="brand-secondary" shape="pill" size="sm" asChild>
          <Link href={CONFIG.ROUTES.STUDENT.PROFILE}>Complete profile</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={dismiss} className="gap-1">
          <XIcon className="size-4" aria-hidden />
          Later
        </Button>
      </div>
    </div>
  )
}
