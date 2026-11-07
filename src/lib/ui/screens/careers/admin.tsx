"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import { CheckIcon, Loader2Icon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import {
  CREATE_PLACEMENT,
  DELETE_PLACEMENT,
  GET_ADMIN_JOBS,
  GET_PLACEMENT_STATS,
  GET_PLACEMENTS,
  REVIEW_ALUMNI_JOB,
  SET_ALUMNI_BY_EMAIL,
  UPDATE_PLACEMENT,
  VERIFY_PLACEMENT,
} from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ConfirmDialog } from "@/lib/ui/useable-components/confirm-dialog"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Input } from "@/lib/ui/useable-components/input"
import { EmptyState, Field, JOB_TYPE_LABEL, JobCard, Pill, jobPath, portfolioPath, selectClass, timeAgo, type Job, type JobType } from "../jobs/shared"
import { Modal } from "./modal"

const errorText = (e: unknown, fallback: string) => (e as Error)?.message || fallback

/* ------------------------------------------------------------------ alumni job approval (on the jobs tab) */

export function AlumniReviewQueue({ onChange }: { onChange?: () => void }) {
  const { data, refetch } = useQuery<{ adminJobs: Job[] }>(GET_ADMIN_JOBS, {
    variables: { source: "ALUMNI", status: null, search: null },
    fetchPolicy: "cache-and-network",
  })
  const [review, { loading }] = useMutation(REVIEW_ALUMNI_JOB)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const waiting = (data?.adminJobs ?? []).filter((j) => j.awaitingReview)
  if (!waiting.length) return null

  const decide = async (id: string, approve: boolean) => {
    try {
      await review({ variables: { id, approve, note: note.trim() || null } })
      toast.success(approve ? "Approved. The job is live." : "Sent back to the graduate")
      setRejecting(null)
      setNote("")
      void refetch()
      onChange?.()
    } catch (e) {
      toast.error(errorText(e, "Couldn't save"))
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
      <div>
        <h3 className="font-semibold">Jobs from graduates waiting for approval ({waiting.length})</h3>
        <p className="text-muted-foreground text-sm">Check the job is real and suitable for students before it goes live.</p>
      </div>
      {waiting.map((j) => (
        <JobCard
          key={j.id}
          job={j}
          href={jobPath(j.id)}
          actions={
            rejecting === j.id ? (
              <div className="flex w-full flex-wrap gap-2">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why, so they can fix it (optional)" className="min-w-60 flex-1" maxLength={500} />
                <Button size="sm" variant="destructive" disabled={loading} onClick={() => void decide(j.id, false)}>
                  Send back
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <span className="text-muted-foreground mr-auto text-sm">
                  From{" "}
                  {j.referrer?.portfolioSlug ? (
                    <Link href={portfolioPath(j.referrer.portfolioSlug)} target="_blank" className="underline">
                      {j.referrer.fullName}
                    </Link>
                  ) : (
                    (j.referrer?.fullName ?? "a graduate")
                  )}{" "}
                  · {j.applyMode === "PORTAL" ? "applications come to them" : "applies on the company's site"}
                </span>
                <Button size="sm" disabled={loading} onClick={() => void decide(j.id, true)}>
                  <CheckIcon className="size-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNote("")
                    setRejecting(j.id)
                  }}
                >
                  <XIcon className="size-4" /> Send back
                </Button>
              </>
            )
          }
        />
      ))}
    </section>
  )
}

/* ------------------------------------------------------------------ placements */

type Placement = {
  id: string
  student: { id: string; fullName: string; email: string | null; portfolioSlug: string | null } | null
  companyName: string
  jobTitle: string
  jobType: string
  startDate: string | null
  courses: string[]
  source: "APPLICATION" | "STUDENT" | "ADMIN"
  verified: boolean
  note: string
  createdAt: string
}

type Stats = {
  graduates: number
  placedGraduates: number
  rate: number | null
  totalPlacements: number
  unverified: number
  byCourse: { courseId: string; title: string; graduates: number; placed: number; rate: number | null }[]
  topCompanies: string[]
}

const SOURCE_LABEL: Record<Placement["source"], string> = {
  APPLICATION: "Hired through the portal",
  STUDENT: "Told us",
  ADMIN: "Added by staff",
}

const pct = (n: number | null) => (n == null ? "–" : `${Math.round(n)}%`)

export function AdminPlacementsScreen() {
  const [range, setRange] = useState({ from: "", to: "" })
  const { data: statsData, loading: statsLoading } = useQuery<{ placementStats: Stats }>(GET_PLACEMENT_STATS, {
    variables: { from: range.from || null, to: range.to || null },
    fetchPolicy: "cache-and-network",
  })
  const stats = statsData?.placementStats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Placements & alumni</h1>
        <p className="text-muted-foreground text-sm">
          Who got hired, where, and after which course. Graduates are students with a certificate; only confirmed placements count.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Certificates from">
            <Input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
          </Field>
          <Field label="to">
            <Input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
          </Field>
          {(range.from || range.to) && (
            <Button variant="ghost" onClick={() => setRange({ from: "", to: "" })}>
              All time
            </Button>
          )}
        </div>
        {statsLoading && !stats ? (
          <ContentAreaLoader />
        ) : stats ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Placed" value={pct(stats.rate)} hint={`${stats.placedGraduates} of ${stats.graduates} graduates`} />
              <Tile label="Graduates" value={String(stats.graduates)} />
              <Tile label="Confirmed placements" value={String(stats.totalPlacements)} hint="Including students without a certificate" />
              <Tile label="To confirm" value={String(stats.unverified)} hint="Reported by students" />
            </div>
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="bg-card overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b text-left text-xs">
                    <tr>
                      <th className="p-3 font-medium">Course</th>
                      <th className="p-3 text-right font-medium">Graduates</th>
                      <th className="p-3 text-right font-medium">Placed</th>
                      <th className="p-3 text-right font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byCourse.length ? (
                      stats.byCourse.map((c) => (
                        <tr key={c.courseId} className="border-b last:border-0">
                          <td className="p-3">{c.title}</td>
                          <td className="p-3 text-right tabular-nums">{c.graduates}</td>
                          <td className="p-3 text-right tabular-nums">{c.placed}</td>
                          <td className="p-3 text-right tabular-nums">{pct(c.rate)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-muted-foreground p-3">
                          No graduates in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-card rounded-xl border p-4">
                <h3 className="text-sm font-semibold">Where they work</h3>
                {stats.topCompanies.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {stats.topCompanies.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-2 text-sm">No confirmed placements yet.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <PlacementList />
      <AlumniByEmail />
    </div>
  )
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  )
}

function PlacementList() {
  const [verified, setVerified] = useState<"" | "true" | "false">("")
  const [search, setSearch] = useState("")
  const [applied, setApplied] = useState("")
  const { data, loading } = useQuery<{ placements: Placement[] }>(GET_PLACEMENTS, {
    variables: { verified: verified === "" ? null : verified === "true", search: applied || null },
    fetchPolicy: "cache-and-network",
  })
  const refetchQueries = ["GetPlacements", "GetPlacementStats"]
  const [verify] = useMutation(VERIFY_PLACEMENT, { refetchQueries })
  const [remove, { loading: removing }] = useMutation(DELETE_PLACEMENT, { refetchQueries })
  const [editing, setEditing] = useState<Placement | "new" | null>(null)
  const [deleting, setDeleting] = useState<Placement | null>(null)
  const items = data?.placements ?? []

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-lg font-semibold">Placements</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setApplied(search.trim())
          }}
        >
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Company, job or student" className="w-56" />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
        <select aria-label="Confirmed" className={`${selectClass} w-auto`} value={verified} onChange={(e) => setVerified(e.target.value as typeof verified)}>
          <option value="">All</option>
          <option value="false">To confirm</option>
          <option value="true">Confirmed</option>
        </select>
        <Button onClick={() => setEditing("new")}>
          <PlusIcon className="size-4" /> Add
        </Button>
      </div>
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !items.length ? (
        <EmptyState title="No placements yet">They appear when a company marks an applicant as hired, a student tells us, or you add one.</EmptyState>
      ) : (
        <div className="bg-card divide-y rounded-xl border">
          {items.map((p) => (
            <div key={p.id} className="flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    {p.student?.portfolioSlug ? (
                      <Link href={portfolioPath(p.student.portfolioSlug)} target="_blank" className="hover:underline">
                        {p.student.fullName}
                      </Link>
                    ) : (
                      (p.student?.fullName ?? "Removed student")
                    )}
                  </p>
                  <Pill className={cn(p.verified ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400")}>
                    {p.verified ? "Confirmed" : "To confirm"}
                  </Pill>
                </div>
                <p className="text-sm">
                  {p.jobTitle} at <strong>{p.companyName}</strong>
                  {p.jobType && ` · ${JOB_TYPE_LABEL[p.jobType as JobType] ?? p.jobType}`}
                  {p.startDate && ` · starts ${p.startDate}`}
                </p>
                <p className="text-muted-foreground text-xs">
                  {SOURCE_LABEL[p.source]} · {timeAgo(p.createdAt)}
                  {p.courses.length > 0 && ` · ${p.courses.join(", ")}`}
                  {p.student?.email && ` · ${p.student.email}`}
                </p>
                {p.note && <p className="text-muted-foreground mt-1 text-xs">Note: {p.note}</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={p.verified ? "outline" : "default"}
                  onClick={() => void verify({ variables: { id: p.id, verified: !p.verified } }).catch((e) => toast.error(errorText(e, "Couldn't update")))}
                >
                  {p.verified ? "Unconfirm" : "Confirm"}
                </Button>
                <Button size="sm" variant="outline" aria-label="Edit" onClick={() => setEditing(p)}>
                  <PencilIcon className="size-4" />
                </Button>
                <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => setDeleting(p)}>
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "Add a placement" : "Edit placement"}>
        {editing && <PlacementForm key={editing === "new" ? "new" : editing.id} placement={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this placement?"
        description="It's removed from the numbers. This can't be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={removing}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await remove({ variables: { id: deleting.id } })
            toast.success("Deleted")
          } catch (e) {
            toast.error(errorText(e, "Couldn't delete"))
          } finally {
            setDeleting(null)
          }
        }}
      />
    </section>
  )
}

function PlacementForm({ placement, onDone }: { placement: Placement | null; onDone: () => void }) {
  const [form, setForm] = useState({
    studentEmail: "",
    companyName: placement?.companyName ?? "",
    jobTitle: placement?.jobTitle ?? "",
    jobType: placement?.jobType || "FULL_TIME",
    startDate: placement?.startDate ?? "",
    note: placement?.note ?? "",
  })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const refetchQueries = ["GetPlacements", "GetPlacementStats"]
  const [create, { loading: creating }] = useMutation(CREATE_PLACEMENT, { refetchQueries })
  const [update, { loading: updating }] = useMutation(UPDATE_PLACEMENT, { refetchQueries })

  const submit = async () => {
    const input = {
      companyName: form.companyName,
      jobTitle: form.jobTitle,
      jobType: form.jobType,
      startDate: form.startDate || null,
      note: form.note,
      ...(placement ? {} : { studentEmail: form.studentEmail.trim() }),
    }
    try {
      if (placement) await update({ variables: { id: placement.id, input } })
      else await create({ variables: { input } })
      toast.success("Saved")
      onDone()
    } catch (e) {
      toast.error(errorText(e, "Couldn't save"))
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      {placement ? (
        <p className="text-sm">
          Student: <strong>{placement.student?.fullName ?? "Removed student"}</strong>
        </p>
      ) : (
        <Field label="Student's email">
          <Input type="email" value={form.studentEmail} onChange={set("studentEmail")} required />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company">
          <Input value={form.companyName} onChange={set("companyName")} required maxLength={120} />
        </Field>
        <Field label="Job title">
          <Input value={form.jobTitle} onChange={set("jobTitle")} required maxLength={140} />
        </Field>
        <Field label="Type">
          <select value={form.jobType} onChange={set("jobType")} className={selectClass}>
            {(Object.keys(JOB_TYPE_LABEL) as JobType[]).map((k) => (
              <option key={k} value={k}>
                {JOB_TYPE_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start date" hint="Optional">
          <Input type="date" value={form.startDate} onChange={set("startDate")} />
        </Field>
      </div>
      <Field label="Note" hint="Staff only">
        <Input value={form.note} onChange={set("note")} maxLength={500} />
      </Field>
      {!placement && <p className="text-muted-foreground text-xs">Placements you add are confirmed straight away.</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={creating || updating}>
          {(creating || updating) && <Loader2Icon className="size-4 animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ alumni */

function AlumniByEmail() {
  const [email, setEmail] = useState("")
  const [setAlumni, { loading }] = useMutation<{ setAlumniByEmail: { isAlumni: boolean; since: string | null } }>(SET_ALUMNI_BY_EMAIL)
  const run = async (isAlumni: boolean) => {
    if (!email.trim()) return toast.error("Enter the student's email")
    try {
      const res = await setAlumni({ variables: { email: email.trim(), isAlumni } })
      toast.success(res.data?.setAlumniByEmail.isAlumni ? "They're alumni now and can post jobs" : "Removed from alumni")
      setEmail("")
    } catch (e) {
      toast.error(errorText(e, "Couldn't update"))
    }
  }
  return (
    <section className="bg-card space-y-3 rounded-xl border p-4">
      <div>
        <h2 className="font-semibold">Alumni</h2>
        <p className="text-muted-foreground text-sm">
          Students become alumni when they get a certificate. Add someone who graduated before certificates were online, so they can post jobs
          and referrals for other students.
        </p>
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void run(true)
        }}
      >
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" className="w-72" />
        <Button type="submit" disabled={loading}>
          Make alumni
        </Button>
        <Button type="button" variant="outline" disabled={loading} onClick={() => void run(false)}>
          Remove
        </Button>
      </form>
    </section>
  )
}
