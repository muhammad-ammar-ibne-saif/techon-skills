"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation } from "@apollo/client/react"
import { CalendarPlusIcon, ExternalLinkIcon, Loader2Icon, MapPinIcon, PhoneIcon, VideoIcon } from "lucide-react"
import toast from "react-hot-toast"

import { CANCEL_INTERVIEW, RESPOND_TO_INTERVIEW, SCHEDULE_INTERVIEW, UPDATE_INTERVIEW } from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { CompanyLogo, Field, Pill, jobPath, portfolioPath, selectClass } from "../jobs/shared"
import { Modal } from "./modal"
import { InterviewScorecards, type InterviewFeedback } from "./scorecard"

export type InterviewMode = "ONLINE" | "ONSITE" | "PHONE"
export type InterviewStatus = "SCHEDULED" | "ACCEPTED" | "DECLINED" | "CANCELLED"

export type Interview = {
  id: string
  companyName: string
  companyLogo: string
  job: { id: string; title: string; companyName: string } | null
  student: { id: string; fullName: string; profilePicture: string; portfolioSlug: string | null } | null
  applicationId: string | null
  startAt: string
  durationMinutes: number
  mode: InterviewMode
  location: string
  meetingUrl: string
  note: string
  status: InterviewStatus
  studentNote: string
  cancelReason: string
  createdAt: string
  suggestedSkills?: string[]
  feedback?: InterviewFeedback[] | null
}

export const MODE_LABEL: Record<InterviewMode, string> = { ONLINE: "Online", ONSITE: "On-site", PHONE: "Phone call" }
const MODE_ICON = { ONLINE: VideoIcon, ONSITE: MapPinIcon, PHONE: PhoneIcon }

export const INTERVIEW_STATUS_LABEL: Record<InterviewStatus, string> = {
  SCHEDULED: "Waiting for reply",
  ACCEPTED: "Accepted",
  DECLINED: "Can't make it",
  CANCELLED: "Cancelled",
}
const STATUS_CLASS: Record<InterviewStatus, string> = {
  SCHEDULED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  ACCEPTED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  DECLINED: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  CANCELLED: "bg-muted text-muted-foreground",
}

export function formatWhen(iso: string, minutes?: number) {
  const d = new Date(iso)
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  return minutes ? `${day}, ${time} · ${minutes} min` : `${day}, ${time}`
}

export const isUpcoming = (iv: Pick<Interview, "startAt" | "durationMinutes">) =>
  new Date(iv.startAt).getTime() + iv.durationMinutes * 60000 > Date.now()

/* ------------------------------------------------------------------ calendar file */

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`)

/** Saves the interview as a .ics file the student can open in any calendar app. */
export function downloadIcs(iv: Interview) {
  const start = new Date(iv.startAt)
  const end = new Date(start.getTime() + iv.durationMinutes * 60000)
  const title = `${iv.job?.title ? `${iv.job.title} interview` : "Interview"} – ${iv.companyName}`
  const details = [iv.note, iv.meetingUrl && `Link: ${iv.meetingUrl}`].filter(Boolean).join("\n\n")
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TechOn Skills//Interviews//EN",
    "BEGIN:VEVENT",
    `UID:interview-${iv.id}@techonskills`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(title)}`,
    details && `DESCRIPTION:${icsText(details)}`,
    (iv.location || iv.meetingUrl) && `LOCATION:${icsText(iv.location || iv.meetingUrl)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "interview.ics"
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ------------------------------------------------------------------ schedule / edit */

type Target =
  | { kind: "application"; applicationId: string; studentName: string }
  | { kind: "candidate"; studentId: string; studentName: string; jobs: { id: string; title: string }[] }
  | { kind: "edit"; interview: Interview }

/** "YYYY-MM-DDTHH:mm" in local time, for datetime-local inputs. */
const localInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function defaultStart() {
  const d = new Date(Date.now() + 2 * 86400000)
  d.setHours(11, 0, 0, 0)
  return localInput(d)
}

export function InterviewDialog({ target, onClose, onSaved }: { target: Target | null; onClose: () => void; onSaved?: () => void }) {
  return (
    <Modal
      open={!!target}
      onOpenChange={(o) => !o && onClose()}
      title={target?.kind === "edit" ? "Change interview" : "Schedule an interview"}
      description={
        target
          ? target.kind === "edit"
            ? `With ${target.interview.student?.fullName ?? "the student"}. They'll be asked to confirm the new details.`
            : `With ${target.studentName}. They get a notification and an email and can accept or decline.`
          : undefined
      }
    >
      {target && <InterviewForm key={target.kind === "edit" ? target.interview.id : target.kind} target={target} onDone={() => (onSaved?.(), onClose())} />}
    </Modal>
  )
}

function InterviewForm({ target, onDone }: { target: Target; onDone: () => void }) {
  const iv = target.kind === "edit" ? target.interview : null
  const [form, setForm] = useState({
    startAt: iv ? localInput(new Date(iv.startAt)) : defaultStart(),
    durationMinutes: String(iv?.durationMinutes ?? 30),
    mode: (iv?.mode ?? "ONLINE") as InterviewMode,
    location: iv?.location ?? "",
    meetingUrl: iv?.meetingUrl ?? "",
    note: iv?.note ?? "",
    jobId: target.kind === "candidate" ? (target.jobs[0]?.id ?? "") : "",
  })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const [schedule, { loading: creating }] = useMutation(SCHEDULE_INTERVIEW, { refetchQueries: ["GetCompanyInterviews"] })
  const [update, { loading: updating }] = useMutation(UPDATE_INTERVIEW, { refetchQueries: ["GetCompanyInterviews"] })
  const saving = creating || updating

  const submit = async () => {
    const start = new Date(form.startAt)
    if (Number.isNaN(start.getTime())) return toast.error("Pick the date and time")
    const input = {
      startAt: start.toISOString(),
      durationMinutes: Number(form.durationMinutes),
      mode: form.mode,
      location: form.location.trim(),
      meetingUrl: form.meetingUrl.trim(),
      note: form.note.trim(),
      ...(target.kind === "application" ? { applicationId: target.applicationId } : {}),
      ...(target.kind === "candidate" ? { studentId: target.studentId, jobId: form.jobId || null } : {}),
    }
    try {
      if (target.kind === "edit") await update({ variables: { id: target.interview.id, input } })
      else await schedule({ variables: { input } })
      toast.success(target.kind === "edit" ? "Interview updated. The student was told." : "Interview sent to the student")
      onDone()
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save the interview")
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
      {target.kind === "candidate" && (
        <Field label="For which job" hint={target.jobs.length ? undefined : "No open jobs. The interview is not tied to a job."}>
          <select value={form.jobId} onChange={set("jobId")} className={selectClass}>
            <option value="">No specific job</option>
            {target.jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date and time" hint="Your local time">
          <Input type="datetime-local" value={form.startAt} onChange={set("startAt")} required />
        </Field>
        <Field label="Length">
          <select value={form.durationMinutes} onChange={set("durationMinutes")} className={selectClass}>
            {[15, 20, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </Field>
        <Field label="How">
          <select value={form.mode} onChange={set("mode")} className={selectClass}>
            {Object.entries(MODE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        {form.mode === "ONLINE" ? (
          <Field label="Meeting link" hint="Optional. You can add it later.">
            <Input value={form.meetingUrl} onChange={set("meetingUrl")} placeholder="https://meet.google.com/…" />
          </Field>
        ) : (
          <Field label={form.mode === "ONSITE" ? "Address" : "Number or details"} hint={form.mode === "PHONE" ? "Optional" : undefined}>
            <Input value={form.location} onChange={set("location")} required={form.mode === "ONSITE"} maxLength={300} />
          </Field>
        )}
      </div>
      <Field label="Note to the student" hint="Optional. Who they'll meet, what to prepare.">
        <Textarea value={form.note} onChange={set("note")} rows={3} maxLength={1000} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2Icon className="size-4 animate-spin" />}
          {target.kind === "edit" ? "Save changes" : "Send invitation"}
        </Button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ cards */

function Details({ iv }: { iv: Interview }) {
  const Icon = MODE_ICON[iv.mode]
  return (
    <div className="text-muted-foreground mt-2 space-y-1 text-sm">
      <p className="text-foreground font-medium">{formatWhen(iv.startAt, iv.durationMinutes)}</p>
      <p className="inline-flex items-center gap-1.5">
        <Icon className="size-4" /> {MODE_LABEL[iv.mode]}
        {iv.location && ` · ${iv.location}`}
      </p>
      {iv.meetingUrl && (
        <p>
          <a href={iv.meetingUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-(--site-accent)">
            <ExternalLinkIcon className="size-4" /> Meeting link
          </a>
        </p>
      )}
      {iv.note && <p className="bg-muted/50 text-foreground rounded-lg p-3 whitespace-pre-line">{iv.note}</p>}
    </div>
  )
}

/** The student's view: accept, decline, add to calendar. */
export function StudentInterviewCard({ iv }: { iv: Interview }) {
  const [respond, { loading }] = useMutation(RESPOND_TO_INTERVIEW)
  const [declining, setDeclining] = useState(false)
  const [note, setNote] = useState("")
  const upcoming = isUpcoming(iv)

  const answer = async (accept: boolean) => {
    try {
      await respond({ variables: { id: iv.id, accept, note: note.trim() || null } })
      toast.success(accept ? "Accepted. The company was told." : "The company was told you can't make it")
      setDeclining(false)
    } catch (e) {
      toast.error((e as Error).message || "Couldn't send your reply")
    }
  }

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-start gap-4">
        <CompanyLogo src={iv.companyLogo} name={iv.companyName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{iv.companyName}</p>
            <Pill className={STATUS_CLASS[iv.status]}>{iv.status === "SCHEDULED" ? "Please reply" : INTERVIEW_STATUS_LABEL[iv.status]}</Pill>
            {!upcoming && iv.status !== "CANCELLED" && <Pill>Past</Pill>}
          </div>
          {iv.job && (
            <Link href={jobPath(iv.job.id)} className="text-muted-foreground text-sm hover:underline">
              {iv.job.title}
            </Link>
          )}
          <Details iv={iv} />
          {iv.status === "CANCELLED" && iv.cancelReason && <p className="text-muted-foreground mt-2 text-sm">Reason: {iv.cancelReason}</p>}
          {iv.studentNote && iv.status !== "CANCELLED" && <p className="text-muted-foreground mt-2 text-sm">Your note: {iv.studentNote}</p>}
        </div>
      </div>
      {upcoming && iv.status !== "CANCELLED" && (
        <div className="mt-3 border-t pt-3">
          {declining ? (
            <div className="space-y-2">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="Optional: a short reason or a time that works better" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="destructive" disabled={loading} onClick={() => void answer(false)}>
                  Tell them I can&apos;t make it
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeclining(false)}>
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {iv.status !== "ACCEPTED" && (
                <Button size="sm" disabled={loading} onClick={() => void answer(true)}>
                  {loading && <Loader2Icon className="size-4 animate-spin" />}
                  Accept
                </Button>
              )}
              {iv.status !== "DECLINED" && (
                <Button size="sm" variant="outline" disabled={loading} onClick={() => setDeclining(true)}>
                  Can&apos;t make it
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => downloadIcs(iv)}>
                <CalendarPlusIcon className="size-4" /> Add to calendar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** The company's view: change or cancel. */
export function CompanyInterviewCard({ iv, onEdit }: { iv: Interview; onEdit: (iv: Interview) => void }) {
  const [cancel, { loading }] = useMutation(CANCEL_INTERVIEW)
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState("")
  const upcoming = isUpcoming(iv)
  const s = iv.student

  const doCancel = async () => {
    try {
      await cancel({ variables: { id: iv.id, reason: reason.trim() || null } })
      toast.success("Cancelled. The student was told.")
      setCancelling(false)
    } catch (e) {
      toast.error((e as Error).message || "Couldn't cancel")
    }
  }

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{s?.fullName ?? "Student"}</p>
        <Pill className={STATUS_CLASS[iv.status]}>{INTERVIEW_STATUS_LABEL[iv.status]}</Pill>
        {!upcoming && iv.status !== "CANCELLED" && <Pill>Past</Pill>}
      </div>
      {iv.job && <p className="text-muted-foreground text-sm">{iv.job.title}</p>}
      <Details iv={iv} />
      {iv.studentNote && <p className="mt-2 text-sm">Student&apos;s note: {iv.studentNote}</p>}
      {iv.status === "CANCELLED" && iv.cancelReason && <p className="text-muted-foreground mt-2 text-sm">Reason: {iv.cancelReason}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
        {s?.portfolioSlug && (
          <Link href={portfolioPath(s.portfolioSlug)} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-(--site-accent)">
            <ExternalLinkIcon className="size-4" /> Portfolio
          </Link>
        )}
        {upcoming && iv.status !== "CANCELLED" && !cancelling && (
          <>
            <Button size="sm" variant="outline" onClick={() => onEdit(iv)}>
              Change
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCancelling(true)}>
              Cancel interview
            </Button>
          </>
        )}
      </div>
      {!upcoming && iv.status !== "CANCELLED" && iv.status !== "DECLINED" && <InterviewScorecards iv={iv} />}
      {cancelling && (
        <div className="mt-3 space-y-2">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Optional reason for the student" />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" disabled={loading} onClick={() => void doCancel()}>
              Cancel it
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCancelling(false)}>
              Keep it
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
