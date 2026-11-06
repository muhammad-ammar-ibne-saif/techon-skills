"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import toast from "react-hot-toast"
import { BellOffIcon, BellRingIcon, Loader2Icon, XIcon } from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { GET_PUSH_CONFIG, REMOVE_PUSH_SUBSCRIPTION, SAVE_PUSH_SUBSCRIPTION } from "@/lib/graphql"
import { useUser } from "@/lib/providers/user"

const SW_URL = "/sw.js"
const DISMISS_KEY = "techon.push-banner-dismissed"

const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

/** Registers the service worker once per page load (installable app + push). */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production" && !window.location.hostname.endsWith("localhost")) return
    navigator.serviceWorker.register(SW_URL).catch(() => undefined)
  }, [])
  return null
}

function base64UrlToBytes(value: string) {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** Push on/off for this browser. `state` is null while loading or when push can't be used here. */
export function usePushNotifications() {
  const { userProfileInfo } = useUser()
  const { data } = useQuery<{ getPushConfig: { enabled: boolean; publicKey: string | null } }>(GET_PUSH_CONFIG, {
    skip: !userProfileInfo?.id,
  })
  const config = data?.getPushConfig
  const [saveSubscription] = useMutation(SAVE_PUSH_SUBSCRIPTION)
  const [removeSubscription] = useMutation(REMOVE_PUSH_SUBSCRIPTION)
  const [state, setState] = useState<"on" | "off" | "blocked" | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!config?.enabled || !pushSupported()) return
    let cancelled = false
    void (async () => {
      if (Notification.permission === "denied") return !cancelled && setState("blocked")
      const reg = await navigator.serviceWorker.getRegistration(SW_URL)
      const sub = await reg?.pushManager.getSubscription()
      if (!cancelled) setState(sub ? "on" : "off")
    })()
    return () => {
      cancelled = true
    }
  }, [config?.enabled])

  const turnOn = async () => {
    if (!config?.publicKey) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off")
        return
      }
      const reg = await navigator.serviceWorker.register(SW_URL)
      await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(config.publicKey) }))
      const json = sub.toJSON()
      await saveSubscription({
        variables: { input: { endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } },
      })
      setState("on")
      toast.success("Notifications are on for this device.")
    } catch {
      toast.error("Couldn't turn on notifications on this device.")
    } finally {
      setBusy(false)
    }
  }

  const turnOff = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL)
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await removeSubscription({ variables: { endpoint: sub.endpoint } }).catch(() => undefined)
        await sub.unsubscribe()
      }
      setState("off")
    } finally {
      setBusy(false)
    }
  }

  return { available: !!config?.enabled && state !== null, state, busy, turnOn, turnOff }
}

/** Small on/off row, e.g. inside the notifications panel. */
export function PushNotificationsToggle() {
  const { available, state, busy, turnOn, turnOff } = usePushNotifications()
  if (!available) return null
  return (
    <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-xs">
      <span className="text-muted-foreground">
        {state === "on"
          ? "Notifications on this device: on"
          : state === "blocked"
            ? "Notifications are blocked in your browser settings"
            : "Get notifications on this device"}
      </span>
      {state !== "blocked" && (
        <Button size="xs" variant={state === "on" ? "ghost" : "default"} disabled={busy} onClick={() => void (state === "on" ? turnOff() : turnOn())}>
          {busy ? <Loader2Icon className="size-3.5 animate-spin" /> : state === "on" ? <BellOffIcon className="size-3.5" /> : <BellRingIcon className="size-3.5" />}
          {state === "on" ? "Turn off" : "Turn on"}
        </Button>
      )}
    </div>
  )
}

/** Dismissible prompt to turn on notifications (shown until turned on or dismissed). */
export function PushNotificationsBanner() {
  const { available, state, busy, turnOn } = usePushNotifications()
  // The banner only shows after push support is checked on the client, so reading storage here can't mismatch the server HTML.
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true
    try {
      return window.localStorage.getItem(DISMISS_KEY) === "1"
    } catch {
      return false
    }
  })
  if (!available || state !== "off" || dismissed) return null
  const dismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // Private mode: it just shows again next time.
    }
  }
  return (
    <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-(--brand-primary)/20 bg-(--brand-primary)/5 p-4 sm:flex-row sm:items-center">
      <BellRingIcon className="text-(--brand-primary) size-6 shrink-0" />
      <div className="flex-1 text-sm">
        <div className="font-semibold">Never miss a class</div>
        <div className="text-muted-foreground">
          Get a notification on this device for classes, answers to your questions, grades and fee reminders. Tip: install the
          portal as an app from your browser menu (&quot;Add to Home screen&quot;).
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" shape="pill" disabled={busy} onClick={() => void turnOn()}>
          {busy && <Loader2Icon className="size-4 animate-spin" />} Turn on
        </Button>
        <button type="button" aria-label="Dismiss" onClick={dismiss} className="text-muted-foreground hover:text-primary rounded-full p-1">
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}
