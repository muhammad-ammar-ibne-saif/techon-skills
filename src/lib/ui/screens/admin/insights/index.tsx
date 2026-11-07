"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DownloadIcon, LightbulbIcon, Loader2Icon, MailIcon, MessageCircleIcon, NotebookPenIcon, PhoneIcon } from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import { GET_AT_RISK_STUDENTS, GET_INSIGHT_REPORTS, LOG_AT_RISK_FOLLOW_UP } from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { Input } from "@/lib/ui/useable-components/input"

type RiskFlag = "LOW_ATTENDANCE" | "MISSED_ASSIGNMENTS" | "UNWATCHED_RECORDINGS" | "OVERDUE_FEE" | "INACTIVE"

type AtRiskStudent = {
  userId: string
  fullName: string
  email: string
  phoneNumber: string
  courseId: string
  courseTitle: string
  batchName: string
  attendancePercent: number | null
  lecturesMarked: number
  missedAssignments: number
  unwatchedRecordings: number
  overdueAmount: number
  lastActivityAt: string | null
  flags: RiskFlag[]
  reasons: string[]
  suggestedAction: string
  lastFollowUp: FollowUp | null
}

type FollowUp = { id: string; note: string; byName: string; snoozeUntil: string | null; createdAt: string }

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

function FollowUpForm({ student, onDone }: { student: AtRiskStudent; onDone: () => void }) {
  const [note, setNote] = useState("")
  const [snooze, setSnooze] = useState(7)
  const [save, { loading }] = useMutation(LOG_AT_RISK_FOLLOW_UP, {
    refetchQueries: [GET_AT_RISK_STUDENTS],
    onCompleted: () => {
      toast.success("Follow-up saved")
      onDone()
    },
    onError: (e) => toast.error(e.message),
  })
  return (
    <form
      className="bg-muted/40 mt-3 space-y-2 rounded-lg p-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!note.trim()) return
        save({ variables: { userId: student.userId, courseId: student.courseId, note: note.trim(), snoozeDays: snooze } })
      }}
    >
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="What happened? e.g. Called, says they were ill, will catch up on recordings this week."
        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        aria-label="Follow-up note"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">
          Don&apos;t alert again for{" "}
          <select className={selectClass} value={snooze} onChange={(e) => setSnooze(Number(e.target.value))}>
            <option value={0}>no pause</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </label>
        <Button type="submit" size="sm" disabled={loading || !note.trim()}>
          {loading && <Loader2Icon className="size-4 animate-spin" />} Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

const FLAG_LABEL: Record<RiskFlag, string> = {
  LOW_ATTENDANCE: "Low attendance",
  MISSED_ASSIGNMENTS: "Missed assignments",
  UNWATCHED_RECORDINGS: "Not watching recordings",
  OVERDUE_FEE: "Fee overdue",
  INACTIVE: "Inactive",
}
const FLAG_CLASS: Record<RiskFlag, string> = {
  LOW_ATTENDANCE: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  MISSED_ASSIGNMENTS: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  UNWATCHED_RECORDINGS: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  OVERDUE_FEE: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  INACTIVE: "bg-muted text-muted-foreground",
}

const selectClass = "border-input bg-background h-9 rounded-md border px-3 text-sm"
const pkr = (n: number) => `PKR ${n.toLocaleString("en-US")}`

/** WhatsApp link for a Pakistani number like 0300 1234567 or +92 300 1234567. */
function whatsappLink(phone: string): string | null {
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`
  return digits.length >= 11 ? `https://wa.me/${digits}` : null
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function PageHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-secondary text-sm font-semibold">Admin</div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{description}</p>
      </div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ at-risk */

export function AdminAtRiskScreen() {
  const { data, loading, error } = useQuery<{ atRiskStudents: AtRiskStudent[] }>(GET_AT_RISK_STUDENTS, { fetchPolicy: "cache-and-network" })
  const [course, setCourse] = useState("")
  const [flag, setFlag] = useState<RiskFlag | "">("")
  const [search, setSearch] = useState("")
  const [hideSnoozed, setHideSnoozed] = useState(false)
  const [logging, setLogging] = useState<string | null>(null)
  const [now] = useState(() => Date.now())
  const all = useMemo(() => data?.atRiskStudents ?? [], [data])
  const courses = useMemo(() => [...new Map(all.map((r) => [r.courseId, r.courseTitle])).entries()], [all])
  const rows = all.filter(
    (r) =>
      (!course || r.courseId === course) &&
      (!flag || r.flags.includes(flag)) &&
      (!hideSnoozed || !r.lastFollowUp?.snoozeUntil || new Date(r.lastFollowUp.snoozeUntil).getTime() < now) &&
      (!search || `${r.fullName} ${r.email} ${r.phoneNumber} ${r.batchName}`.toLowerCase().includes(search.toLowerCase()))
  )
  const flagCounts = Object.fromEntries((Object.keys(FLAG_LABEL) as RiskFlag[]).map((f) => [f, all.filter((r) => r.flags.includes(f)).length]))

  return (
    <div className="w-full py-6">
      <PageHeader
        title="Students to follow up"
        description="Students who may be falling behind: attendance under 75%, two or more assignments missed, three or more recent recordings not opened, an overdue fee, or no activity for two weeks."
      >
        <Button
          variant="outline"
          disabled={!rows.length}
          onClick={() =>
            downloadCsv("students-to-follow-up.csv", [
              ["Name", "Email", "Phone", "Course", "Batch", "Reasons", "Suggested next step", "Last follow-up"],
              ...rows.map((r) => [
                r.fullName,
                r.email,
                r.phoneNumber,
                r.courseTitle,
                r.batchName,
                r.reasons.join("; "),
                r.suggestedAction,
                r.lastFollowUp ? `${shortDate(r.lastFollowUp.createdAt)} ${r.lastFollowUp.byName}: ${r.lastFollowUp.note}` : "",
              ]),
            ])
          }
        >
          <DownloadIcon className="size-4" /> Download CSV
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, batch" className="w-64" />
        <select aria-label="Course" className={selectClass} value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">All courses</option>
          {courses.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hideSnoozed} onChange={(e) => setHideSnoozed(e.target.checked)} /> Hide paused
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FLAG_LABEL) as RiskFlag[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFlag((cur) => (cur === f ? "" : f))}
              className={cn("rounded-full px-2.5 py-1 text-xs font-medium", FLAG_CLASS[f], flag === f && "ring-foreground/40 ring-2")}
            >
              {FLAG_LABEL[f]} {flagCounts[f]}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="text-muted-foreground flex items-center gap-2 py-16">
          <Loader2Icon className="size-5 animate-spin" /> Checking students…
        </div>
      ) : error && !data ? (
        <p className="text-destructive">{error.message}</p>
      ) : !rows.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">{all.length ? "No students match these filters." : "Nobody needs a follow-up right now."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {rows.length} student{rows.length === 1 ? "" : "s"}
          </p>
          {rows.map((r) => {
            const wa = whatsappLink(r.phoneNumber)
            return (
              <div key={`${r.userId}:${r.courseId}`} className="bg-card rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.fullName}</p>
                    <p className="text-muted-foreground text-sm">
                      {r.courseTitle}
                      {r.batchName && ` · ${r.batchName}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.flags.map((f) => (
                      <span key={f} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", FLAG_CLASS[f])}>
                        {FLAG_LABEL[f]}
                      </span>
                    ))}
                  </div>
                </div>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
                  {r.reasons.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                {r.suggestedAction && (
                  <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm">
                    <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <span>
                      <span className="font-medium">Next step:</span> {r.suggestedAction}
                    </span>
                  </p>
                )}
                {r.lastFollowUp && (
                  <p className="text-muted-foreground mt-2 text-sm">
                    Last follow-up {shortDate(r.lastFollowUp.createdAt)} by {r.lastFollowUp.byName}: “{r.lastFollowUp.note}”
                    {r.lastFollowUp.snoozeUntil && new Date(r.lastFollowUp.snoozeUntil).getTime() > now && (
                      <span> · alerts paused until {shortDate(r.lastFollowUp.snoozeUntil)}</span>
                    )}
                  </p>
                )}
                <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {r.phoneNumber && (
                    <a href={`tel:${r.phoneNumber}`} className="hover:text-foreground inline-flex items-center gap-1">
                      <PhoneIcon className="size-4" /> {r.phoneNumber}
                    </a>
                  )}
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-foreground inline-flex items-center gap-1">
                      <MessageCircleIcon className="size-4" /> WhatsApp
                    </a>
                  )}
                  <a href={`mailto:${r.email}`} className="hover:text-foreground inline-flex items-center gap-1">
                    <MailIcon className="size-4" /> {r.email}
                  </a>
                  {logging !== `${r.userId}:${r.courseId}` && (
                    <button
                      type="button"
                      onClick={() => setLogging(`${r.userId}:${r.courseId}`)}
                      className="hover:text-foreground inline-flex items-center gap-1 font-medium"
                    >
                      <NotebookPenIcon className="size-4" /> Log follow-up
                    </button>
                  )}
                </div>
                {logging === `${r.userId}:${r.courseId}` && <FollowUpForm student={r} onDone={() => setLogging(null)} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ reports */

type BatchReport = {
  batchId: string
  batchName: string
  courseId: string
  courseTitle: string
  isArchived: boolean
  students: number
  feeTotal: number
  feeCollected: number
  feeDueNow: number
  feeOverdue: number
  collectedPercent: number
  inactiveStudents: number
  dropoutPercent: number
}
type CourseReport = { courseId: string; courseTitle: string; students: number; revenue: number; outstanding: number; averagePerStudent: number }

function Bar({ percent, className }: { percent: number; className: string }) {
  return (
    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
      <div className={cn("h-full rounded-full", className)} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
    </div>
  )
}

export function AdminReportsScreen() {
  const { data, loading, error } = useQuery<{ insightReports: { batches: BatchReport[]; courses: CourseReport[]; inactiveDays: number } }>(
    GET_INSIGHT_REPORTS,
    { fetchPolicy: "cache-and-network" }
  )
  const [showArchived, setShowArchived] = useState(false)
  if (loading && !data)
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-16">
        <Loader2Icon className="size-5 animate-spin" /> Adding up…
      </div>
    )
  if (!data) return <p className="text-destructive py-10">{error?.message ?? "Couldn't load the reports."}</p>

  const { courses, inactiveDays } = data.insightReports
  const batches = data.insightReports.batches.filter((b) => showArchived || !b.isArchived)
  const sum = (k: keyof BatchReport) => batches.reduce((s, b) => s + (b[k] as number), 0)
  const dueNow = sum("feeDueNow")
  const collected = sum("feeCollected")
  const students = sum("students")
  const inactive = sum("inactiveStudents")
  const maxRevenue = Math.max(1, ...courses.map((c) => c.revenue))

  return (
    <div className="w-full space-y-8 py-6">
      <PageHeader
        title="Reports"
        description={`Fees collected against fees due for each batch, how many students dropped off (no activity for ${inactiveDays} days or an inactive account), and which courses bring in the most.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Collected" value={pkr(collected)} sub={`of ${pkr(dueNow)} due so far`} />
        <Stat label="Overdue" value={pkr(sum("feeOverdue"))} />
        <Stat label="Students in batches" value={String(students)} />
        <Stat label="Drop-off" value={`${students ? Math.round((inactive / students) * 100) : 0}%`} sub={`${inactive} students inactive`} />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">By batch</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv("batch-report.csv", [
                  ["Course", "Batch", "Students", "Total fees", "Due so far", "Collected", "Overdue", "Collected %", "Inactive", "Drop-off %"],
                  ...batches.map((b) => [
                    b.courseTitle,
                    b.batchName,
                    b.students,
                    b.feeTotal,
                    b.feeDueNow,
                    b.feeCollected,
                    b.feeOverdue,
                    b.collectedPercent,
                    b.inactiveStudents,
                    b.dropoutPercent,
                  ]),
                ])
              }
            >
              <DownloadIcon className="size-4" /> CSV
            </Button>
          </div>
        </div>
        {!batches.length ? (
          <p className="text-muted-foreground text-sm">No batches yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="p-3 font-medium">Batch</th>
                  <th className="p-3 font-medium">Students</th>
                  <th className="p-3 font-medium">Collected / due so far</th>
                  <th className="p-3 font-medium">Overdue</th>
                  <th className="p-3 font-medium">Still to come</th>
                  <th className="p-3 font-medium">Drop-off</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.batchId} className="border-b last:border-b-0">
                    <td className="p-3">
                      <p className="font-medium">{b.batchName}</p>
                      <p className="text-muted-foreground text-xs">
                        {b.courseTitle}
                        {b.isArchived && " · archived"}
                      </p>
                    </td>
                    <td className="p-3">{b.students}</td>
                    <td className="w-56 p-3">
                      <p>
                        {pkr(b.feeCollected)} / {pkr(b.feeDueNow)}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Bar percent={b.collectedPercent} className={b.collectedPercent >= 90 ? "bg-emerald-500" : b.collectedPercent >= 70 ? "bg-amber-500" : "bg-rose-500"} />
                        <span className="text-muted-foreground text-xs">{b.collectedPercent}%</span>
                      </div>
                    </td>
                    <td className={cn("p-3", b.feeOverdue > 0 && "font-medium text-rose-600")}>{pkr(b.feeOverdue)}</td>
                    <td className="text-muted-foreground p-3">{pkr(Math.max(0, b.feeTotal - b.feeDueNow))}</td>
                    <td className="p-3">
                      {b.dropoutPercent}%<span className="text-muted-foreground text-xs"> ({b.inactiveStudents})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Revenue by course (all time)</h2>
        {!courses.length ? (
          <p className="text-muted-foreground text-sm">No payments yet.</p>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <div key={c.courseId} className="bg-card rounded-xl border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{c.courseTitle}</p>
                  <p className="font-semibold">{pkr(c.revenue)}</p>
                </div>
                <div className="mt-2">
                  <Bar percent={(c.revenue / maxRevenue) * 100} className="bg-(--brand-primary)" />
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  {c.students} students · {pkr(c.averagePerStudent)} per student · {pkr(c.outstanding)} still to collect
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
