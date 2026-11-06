"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import toast from "react-hot-toast"
import { CalendarIcon, CheckCircle2Icon, Loader2Icon, TagIcon, UsersIcon, XIcon } from "lucide-react"

import { cn, getApiDisplayMessage } from "@/lib/helpers"
import { apiService } from "@/lib/services/api"
import { Button } from "@/lib/ui/useable-components/button"
import { Input } from "@/lib/ui/useable-components/input"
import type { IContactFormCourse, IEnrollmentCodeResult, IOpenBatch } from "@/utils/interfaces"

/** Referral and deal links (/enrollment?ref=CODE or ?code=CODE) are remembered for the visit, so the code survives browsing. */
const REF_KEY = "techon.referral-code"

export function readReferralFromUrl(): string {
  if (typeof window === "undefined") return ""
  try {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = (params.get("ref") ?? params.get("code"))?.trim().toUpperCase().slice(0, 40) ?? ""
    if (fromUrl) sessionStorage.setItem(REF_KEY, fromUrl)
    return fromUrl || sessionStorage.getItem(REF_KEY) || ""
  } catch {
    return ""
  }
}

const subscribeNever = () => () => {}

export const formatStartDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : null

export function seatsText(b: IOpenBatch) {
  if (b.isFull) return "Full"
  if (b.seatsLeft == null) return "Seats open"
  return b.seatsLeft <= 5 ? `Only ${b.seatsLeft} seat${b.seatsLeft === 1 ? "" : "s"} left` : `${b.seatsLeft} seats left`
}

/** Coupon / scholarship / referral code with an Apply button. Cleared when the courses change. */
export function DiscountCodeField({
  courses,
  email,
  applied,
  onApplied,
  inputClassName,
}: {
  courses: IContactFormCourse[]
  email: string
  applied: IEnrollmentCodeResult | null
  onApplied: (result: IEnrollmentCodeResult | null) => void
  inputClassName?: string
}) {
  // null until the applicant types: until then a referral link's code fills the field.
  const [typed, setCode] = useState<string | null>(null)
  const referral = useSyncExternalStore(subscribeNever, readReferralFromUrl, () => "")
  const code = typed ?? referral
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const slugs = useMemo(() => courses.map((c) => c.slug), [courses])
  const slugKey = slugs.join(",")

  const check = async (value = code) => {
    const clean = value.trim()
    if (!clean) return
    if (!slugs.length) {
      setError("Pick your course(s) first.")
      return
    }
    setChecking(true)
    setError(null)
    try {
      const res = await apiService.checkEnrollmentCode({ code: clean, courses: slugs, email: email || undefined })
      if (res.success && res.data) {
        onApplied(res.data)
        setCode(res.data.code)
      } else {
        onApplied(null)
        setError(getApiDisplayMessage(res, "That code isn't valid."))
      }
    } catch {
      setError("Couldn't check the code. Try again.")
    } finally {
      setChecking(false)
    }
  }

  // The discount depends on the courses, so re-check when they change.
  useEffect(() => {
    if (!slugKey) {
      onApplied(null)
      return
    }
    const value = applied?.code ?? code
    if (!value.trim()) return
    const t = window.setTimeout(() => void check(value), 300)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugKey])

  if (applied) {
    const total = applied.discounts.reduce((s, d) => s + d.amount, 0)
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
        <span className="flex items-center gap-2">
          <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            <span className="font-semibold">{applied.code}</span> · {applied.label}
            {total > 0 && <span className="text-muted-foreground"> (PKR {total.toLocaleString()} off)</span>}
          </span>
        </span>
        <button
          type="button"
          aria-label="Remove code"
          className="text-muted-foreground hover:text-foreground rounded-full p-1"
          onClick={() => {
            onApplied(null)
            setCode("")
            try {
              sessionStorage.removeItem(REF_KEY)
            } catch {
              /* ignore */
            }
          }}
        >
          <XIcon className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <TagIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void check()
              }
            }}
            placeholder="Coupon, scholarship or referral code (optional)"
            className={cn("pl-9 uppercase placeholder:normal-case", inputClassName)}
            maxLength={40}
            aria-invalid={!!error}
          />
        </div>
        <Button type="button" variant="outline" shape="pill" disabled={!code.trim() || checking} onClick={() => void check()}>
          {checking && <Loader2Icon className="size-4 animate-spin" />} Apply
        </Button>
      </div>
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  )
}

/** Open batches of the selected courses, keyed by slug. */
export function useOpenBatches(courses: IContactFormCourse[]) {
  const slugKey = courses.map((c) => c.slug).join(",")
  const [batches, setBatches] = useState<Record<string, IOpenBatch[]>>({})
  const [reload, setReload] = useState(0)
  useEffect(() => {
    if (!slugKey) return
    let cancelled = false
    apiService
      .getOpenBatches(slugKey.split(","))
      .then((res) => {
        if (!cancelled && res.success && res.data) setBatches(res.data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [slugKey, reload])
  return { batches: slugKey ? batches : {}, refresh: () => setReload((n) => n + 1) }
}

/**
 * Batch choice for each selected course that has open batches. Full batches offer the waiting list
 * instead (using the name, email and phone typed into the form).
 */
export function BatchPicker({
  courses,
  onChange,
  applicant,
}: {
  courses: IContactFormCourse[]
  onChange: (courses: IContactFormCourse[]) => void
  applicant: { name: string; email: string; phone: string }
}) {
  const { batches, refresh } = useOpenBatches(courses)
  const [joining, setJoining] = useState<string | null>(null)
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const withBatches = courses.filter((c) => (batches[c.slug]?.length ?? 0) > 0)

  // Pick the first batch with room by default, and drop picks that are no longer offered.
  useEffect(() => {
    let changed = false
    const next = courses.map((c) => {
      const list = batches[c.slug]
      if (!list) return c
      const current = list.find((b) => b.id === c.batchId && !b.isFull)
      if (current) return c
      const firstOpen = list.find((b) => !b.isFull)?.id ?? null
      if ((c.batchId ?? null) === firstOpen) return c
      changed = true
      return { ...c, batchId: firstOpen }
    })
    if (changed) onChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches])

  if (!withBatches.length) return null

  const join = async (batch: IOpenBatch) => {
    if (!applicant.name.trim() || !applicant.email.trim()) {
      toast.error("Fill in your name and email above first.")
      return
    }
    setJoining(batch.id)
    try {
      const res = await apiService.joinBatchWaitlist({ batchId: batch.id, ...applicant })
      if (res.success) {
        setJoined((s) => new Set(s).add(batch.id))
        toast.success(getApiDisplayMessage(res, "You're on the waiting list."))
      } else toast.error(getApiDisplayMessage(res, "Couldn't join the waiting list."))
    } finally {
      setJoining(null)
      refresh()
    }
  }

  return (
    <fieldset className="w-full space-y-3">
      <legend className="text-muted-foreground mb-1.5 text-xs font-medium">Choose your batch</legend>
      {withBatches.map((c) => (
        <div key={c.slug} className="space-y-2">
          {courses.length > 1 && <div className="text-sm font-medium">{c.title}</div>}
          <div className="grid gap-2 sm:grid-cols-2">
            {batches[c.slug]!.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  c.batchId === b.id ? "border-(--brand-primary) bg-(--brand-primary)/10" : "border-border",
                  b.isFull && "opacity-80"
                )}
              >
                <label className={cn("flex items-center gap-2 font-medium", b.isFull ? "cursor-not-allowed" : "cursor-pointer")}>
                  <input
                    type="radio"
                    name={`batch-${c.slug}`}
                    checked={c.batchId === b.id}
                    disabled={b.isFull}
                    onChange={() => onChange(courses.map((x) => (x.slug === c.slug ? { ...x, batchId: b.id } : x)))}
                    className="accent-(--brand-primary)"
                  />
                  {b.name}
                </label>
                <span className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                  {formatStartDate(b.startDate) && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="size-3" /> Starts {formatStartDate(b.startDate)}
                    </span>
                  )}
                  <span className={cn("inline-flex items-center gap-1", b.isFull ? "text-destructive" : b.seatsLeft != null && b.seatsLeft <= 5 && "text-amber-600")}>
                    <UsersIcon className="size-3" /> {seatsText(b)}
                  </span>
                </span>
                {b.isFull &&
                  (joined.has(b.id) ? (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">You&apos;re on the waiting list</span>
                  ) : (
                    <Button type="button" size="xs" variant="outline" shape="pill" className="w-fit" disabled={joining === b.id} onClick={() => void join(b)}>
                      {joining === b.id && <Loader2Icon className="size-3.5 animate-spin" />} Join waiting list
                    </Button>
                  ))}
              </div>
            ))}
          </div>
          {batches[c.slug]!.every((b) => b.isFull) && (
            <p className="text-muted-foreground text-xs">
              Every batch is full right now. Join a waiting list, or apply anyway and we&apos;ll place you in the next batch.
            </p>
          )}
        </div>
      ))}
    </fieldset>
  )
}
