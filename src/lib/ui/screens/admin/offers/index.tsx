"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import toast from "react-hot-toast"
import { Loader2Icon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import {
  CREATE_COUPON,
  DELETE_COUPON,
  GET_COUPONS,
  GET_COURSES,
  GET_REFERRALS_ADMIN,
  GET_REFERRAL_SETTINGS,
  UPDATE_COUPON,
  UPDATE_REFERRAL_SETTINGS,
} from "@/lib/graphql"
import { cn, formatDate } from "@/lib/helpers"

type Coupon = {
  id: string
  code: string
  label: string
  kind: "PERCENT" | "AMOUNT"
  value: number
  courseIds: string[]
  validFrom: string | null
  validUntil: string | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  note: string
}

type Form = {
  code: string
  label: string
  kind: "PERCENT" | "AMOUNT"
  value: string
  courseIds: string[]
  validFrom: string
  validUntil: string
  maxUses: string
  isActive: boolean
  note: string
}

const emptyForm: Form = { code: "", label: "", kind: "PERCENT", value: "", courseIds: [], validFrom: "", validUntil: "", maxUses: "", isActive: true, note: "" }
/** ISO instant → YYYY-MM-DD in Pakistan, for date inputs. */
const toDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }) : "")
const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.")
const selectCls = "border-input bg-background h-9 w-full rounded-md border px-3 text-sm"

function CouponForm({ initial, courses, onDone }: { initial: Coupon | null; courses: { id: string; title: string }[]; onDone: () => void }) {
  const [form, setForm] = useState<Form>(
    initial
      ? {
          code: initial.code,
          label: initial.label,
          kind: initial.kind,
          value: String(initial.value),
          courseIds: initial.courseIds,
          validFrom: toDay(initial.validFrom),
          validUntil: toDay(initial.validUntil),
          maxUses: initial.maxUses == null ? "" : String(initial.maxUses),
          isActive: initial.isActive,
          note: initial.note,
        }
      : emptyForm
  )
  const [create, { loading: creating }] = useMutation(CREATE_COUPON)
  const [update, { loading: updating }] = useMutation(UPDATE_COUPON)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    const input = {
      code: form.code.trim(),
      label: form.label.trim(),
      kind: form.kind,
      value: Number(form.value),
      courseIds: form.courseIds,
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
      maxUses: form.maxUses.trim() ? Number(form.maxUses) : null,
      isActive: form.isActive,
      note: form.note.trim(),
    }
    try {
      if (initial) await update({ variables: { id: initial.id, input } })
      else await create({ variables: { input } })
      toast.success(initial ? "Coupon saved" : "Coupon created")
      onDone()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{initial ? `Edit ${initial.code}` : "New coupon or scholarship"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Code</span>
          <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="EID20" maxLength={40} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Name shown to applicants</span>
          <Input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="Eid offer / Merit scholarship" maxLength={80} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Discount</span>
          <div className="flex gap-2">
            <Input type="number" min={1} value={form.value} onChange={(e) => set("value", e.target.value)} className="w-28" />
            <select value={form.kind} onChange={(e) => set("kind", e.target.value as Form["kind"])} className={selectCls}>
              <option value="PERCENT">% off each course</option>
              <option value="AMOUNT">PKR off each course</option>
            </select>
          </div>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Max uses (empty = no limit)</span>
          <Input type="number" min={1} value={form.maxUses} onChange={(e) => set("maxUses", e.target.value)} placeholder="e.g. 1 for one scholarship" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Valid from (optional)</span>
          <Input type="date" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Valid until (optional)</span>
          <Input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
        </label>
        <div className="space-y-1 text-sm sm:col-span-2">
          <span className="text-muted-foreground text-xs">Courses (none ticked = every course)</span>
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <label key={c.id} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", form.courseIds.includes(c.id) && "border-(--brand-primary) bg-(--brand-primary)/10")}>
                <input
                  type="checkbox"
                  checked={form.courseIds.includes(c.id)}
                  onChange={(e) => set("courseIds", e.target.checked ? [...form.courseIds, c.id] : form.courseIds.filter((x) => x !== c.id))}
                />
                {c.title}
              </label>
            ))}
          </div>
        </div>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="text-muted-foreground text-xs">Staff note (not shown to applicants)</span>
          <Input value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="e.g. scholarship for Ahmed, approved by director" maxLength={300} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button disabled={creating || updating || !form.code.trim() || !form.value} onClick={() => void save()}>
            {(creating || updating) && <Loader2Icon className="size-4 animate-spin" />} Save
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ReferralSettingsCard() {
  const { data } = useQuery<{ getReferralSettings: { isActive: boolean; referrerReward: number; friendDiscount: number } }>(GET_REFERRAL_SETTINGS)
  const [save, { loading }] = useMutation(UPDATE_REFERRAL_SETTINGS)
  const [form, setForm] = useState({ isActive: true, referrerReward: "", friendDiscount: "" })
  const current = data?.getReferralSettings
  const [loadedFrom, setLoadedFrom] = useState<typeof current>(undefined)
  if (current && current !== loadedFrom) {
    setLoadedFrom(current)
    setForm({ isActive: current.isActive, referrerReward: String(current.referrerReward), friendDiscount: String(current.friendDiscount) })
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Referral program</CardTitle>
        <CardDescription>
          Every student gets a code on their &quot;Refer a friend&quot; page. When a friend enrolls with it, the reward comes off the
          referrer&apos;s next unpaid installment.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Reward for the referrer (PKR)</span>
          <Input type="number" min={0} value={form.referrerReward} onChange={(e) => setForm({ ...form, referrerReward: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground text-xs">Discount for the friend (PKR)</span>
          <Input type="number" min={0} value={form.friendDiscount} onChange={(e) => setForm({ ...form, friendDiscount: e.target.value })} />
        </label>
        <div className="flex items-end justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Program on
          </label>
          <Button
            disabled={loading}
            onClick={() =>
              save({
                variables: {
                  input: { isActive: form.isActive, referrerReward: Number(form.referrerReward || 0), friendDiscount: Number(form.friendDiscount || 0) },
                },
              })
                .then(() => toast.success("Referral settings saved"))
                .catch((e) => toast.error(errorMessage(e)))
            }
          >
            {loading && <Loader2Icon className="size-4 animate-spin" />} Save
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const REFERRAL_STATUS: Record<string, string> = {
  PENDING: "Applied",
  REWARDED: "Rewarded",
  CREDIT_UNUSED: "Reward to settle by hand",
  CANCELLED: "Rejected",
}

/** Admin: coupons/scholarships and the referral program. */
export const AdminOffersScreen = () => {
  const { data, loading, refetch } = useQuery<{ getCoupons: Coupon[] }>(GET_COUPONS, { fetchPolicy: "cache-and-network" })
  const { data: coursesData } = useQuery<{ getCourses: { id: string; title: string }[] }>(GET_COURSES)
  const { data: referralsData } = useQuery<{
    getReferralsAdmin: { id: string; friendName: string; friendEmail: string | null; referrerName: string | null; referrerEmail: string | null; status: string; rewardAmount: number; rewardApplied: number; createdAt: string }[]
  }>(GET_REFERRALS_ADMIN, { fetchPolicy: "cache-and-network" })
  const [remove] = useMutation(DELETE_COUPON)
  const [editing, setEditing] = useState<Coupon | "new" | null>(null)
  const courses = coursesData?.getCourses ?? []
  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? "Course"
  const coupons = data?.getCoupons ?? []
  const referrals = referralsData?.getReferralsAdmin ?? []

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-secondary">Admin</div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Coupons &amp; referrals</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
            Applicants enter a code on the enrollment form. The discount comes off the course fee first; paying in full then
            takes one month off what&apos;s left.
          </p>
        </div>
        {!editing && (
          <Button variant="brand-secondary" shape="pill" onClick={() => setEditing("new")}>
            <PlusIcon className="size-4" /> New coupon
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {editing && (
          <CouponForm
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? null : editing}
            courses={courses}
            onDone={() => {
              setEditing(null)
              void refetch()
            }}
          />
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold">Coupons and scholarships</h2>
          {loading && !data ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2Icon className="size-4 animate-spin" /> Loading…
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-muted-foreground rounded-2xl border border-dashed py-10 text-center text-sm">No coupons yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="p-3 font-semibold">Code</th>
                    <th className="p-3 font-semibold">Discount</th>
                    <th className="p-3 font-semibold">Courses</th>
                    <th className="p-3 font-semibold">Valid</th>
                    <th className="p-3 font-semibold">Used</th>
                    <th className="p-3 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className={cn("border-b last:border-0", !c.isActive && "opacity-60")}>
                      <td className="p-3">
                        <div className="font-mono font-semibold">{c.code}</div>
                        <div className="text-muted-foreground text-xs">{c.label || (c.isActive ? "" : "Inactive")}</div>
                        {c.note && <div className="text-muted-foreground text-xs italic">{c.note}</div>}
                      </td>
                      <td className="p-3">{c.kind === "PERCENT" ? `${c.value}%` : `PKR ${c.value.toLocaleString()}`}</td>
                      <td className="p-3 text-xs">{c.courseIds.length ? c.courseIds.map(courseTitle).join(", ") : "All courses"}</td>
                      <td className="text-muted-foreground p-3 text-xs">
                        {c.validFrom || c.validUntil ? `${c.validFrom ? formatDate(c.validFrom) : "now"} → ${c.validUntil ? formatDate(c.validUntil) : "no end"}` : "Always"}
                      </td>
                      <td className="p-3 tabular-nums">
                        {c.usedCount}
                        {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(c)}>
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Delete"
                            className="text-destructive"
                            onClick={async () => {
                              if (!window.confirm(c.usedCount > 0 ? `${c.code} has been used, so it will be switched off instead. Continue?` : `Delete ${c.code}?`)) return
                              try {
                                await remove({ variables: { id: c.id } })
                                await refetch()
                              } catch (e) {
                                toast.error(errorMessage(e))
                              }
                            }}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ReferralSettingsCard />

        <section>
          <h2 className="mb-3 text-lg font-semibold">Referrals</h2>
          {referrals.length === 0 ? (
            <div className="text-muted-foreground rounded-2xl border border-dashed py-10 text-center text-sm">No referrals yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="p-3 font-semibold">Friend</th>
                    <th className="p-3 font-semibold">Referred by</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Reward</th>
                    <th className="p-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3">
                        <div className="font-medium">{r.friendName}</div>
                        <div className="text-muted-foreground text-xs">{r.friendEmail}</div>
                      </td>
                      <td className="p-3">
                        <div>{r.referrerName}</div>
                        <div className="text-muted-foreground text-xs">{r.referrerEmail}</div>
                      </td>
                      <td className={cn("p-3", r.status === "CREDIT_UNUSED" && "font-medium text-amber-700 dark:text-amber-400")}>
                        {REFERRAL_STATUS[r.status] ?? r.status}
                      </td>
                      <td className="p-3 tabular-nums">
                        PKR {r.rewardAmount.toLocaleString()}
                        {r.status === "CREDIT_UNUSED" && <div className="text-muted-foreground text-xs">PKR {(r.rewardAmount - r.rewardApplied).toLocaleString()} still owed</div>}
                      </td>
                      <td className="text-muted-foreground p-3 text-xs">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
