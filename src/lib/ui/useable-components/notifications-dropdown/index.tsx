"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { BellIcon, CheckCheckIcon, Loader2Icon } from "lucide-react"
import { useQuery, useMutation } from "@apollo/client/react"

import { Button } from "@/lib/ui/useable-components/button"
import { cn, formatDateTime } from "@/lib/helpers"
import {
  GET_MY_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATION_COUNT,
  GET_PAYMENTS_BY_USER,
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
} from "@/lib/graphql"
import { isDueMonthReached } from "@/lib/helpers"
import { useUser } from "@/lib/providers/user"
import { PushNotificationsToggle } from "@/lib/ui/useable-components/push-notifications"

type Notification = {
  id: string
  title: string
  message: string
  link: string
  readAt: string | null
  createdAt: string
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { userProfileInfo } = useUser()
  const isStudent = pathname?.startsWith("/student")
  const { data, loading, refetch } = useQuery<{ getMyNotifications: Notification[] }>(GET_MY_NOTIFICATIONS, {
    variables: { limit: 20 },
    pollInterval: 10_000,
    fetchPolicy: "network-only",
  })
  const { data: countData, refetch: refetchCount } = useQuery<{ getUnreadNotificationCount: number }>(
    GET_UNREAD_NOTIFICATION_COUNT,
    { pollInterval: 10_000, fetchPolicy: "network-only" }
  )
  const { data: paymentsData } = useQuery<{ getPaymentsByUser: Array<{ isPaid: boolean; paymentDate: string }> }>(GET_PAYMENTS_BY_USER, {
    variables: { userId: userProfileInfo?.id ?? "" },
    skip: !userProfileInfo?.id || !isStudent,
  })
  const pendingDuesCount = isStudent
    ? (paymentsData?.getPaymentsByUser ?? []).filter((p) => !p.isPaid && isDueMonthReached(p.paymentDate)).length
    : 0
  const [markRead] = useMutation(MARK_NOTIFICATION_READ, {
    onCompleted: () => {
      refetch()
      refetchCount()
    },
  })
  const [markAllRead, { loading: markingAll }] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    onCompleted: () => {
      refetch()
      refetchCount()
    },
  })

  const notifications = data?.getMyNotifications ?? []
  const unreadCount = countData?.getUnreadNotificationCount ?? 0
  const badgeCount = unreadCount + (pendingDuesCount > 0 ? pendingDuesCount : 0)

  useEffect(() => {
    if (open) {
      refetch()
      refetchCount()
    }
  }, [open, refetch, refetchCount])

  const handleNotificationClick = (n: Notification) => {
    setOpen(false)
    if (!n.readAt) markRead({ variables: { id: n.id } })
    if (n.link) {
      const marksBase = "/student/marks"
      if (n.link === marksBase || n.link.startsWith(`${marksBase}?`) || n.link.startsWith(`${marksBase}#`)) {
        router.push(`${marksBase}?filter=pending`)
        return
      }
      router.push(n.link)
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-label="Notifications">
          <BellIcon className="size-5" />
          {(badgeCount > 0) && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 data-[state=open]:animate-in data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed right-4 top-[3.75rem] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-background shadow-lg outline-none",
            "data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2"
          )}
        >
          <DialogPrimitive.Title className="sr-only">Notifications</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Your recent notifications and unpaid fee reminders
          </DialogPrimitive.Description>
          <div className="border-b px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => markAllRead()}
                disabled={markingAll}
              >
                {markingAll ? <Loader2Icon className="size-3 animate-spin" /> : <CheckCheckIcon className="size-3" />}
                Mark all read
              </Button>
              )}
            </div>
            {pendingDuesCount > 0 && (
              <p className="text-muted-foreground text-xs">
                You have <strong>{pendingDuesCount}</strong> pending fee{pendingDuesCount !== 1 ? "s" : ""}. <a href="/student/fees" className="text-(--brand-highlight) hover:underline">Pay now</a>
              </p>
            )}
          </div>
          <div className="max-h-[min(20rem,60vh)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                <Loader2Icon className="size-4 animate-spin" />
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No notifications yet.</div>
            ) : (
              <ul className="divide-y">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-muted-surface/50 transition-colors",
                        !n.readAt && "bg-muted-surface/30"
                      )}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="font-medium text-sm">{n.title}</div>
                      {n.message && <div className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{n.message}</div>}
                      <div className="text-muted-foreground text-[10px] mt-1">
                        {formatDateTime(n.createdAt)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <PushNotificationsToggle />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
