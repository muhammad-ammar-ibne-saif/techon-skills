"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import { CalendarPlusIcon, ExternalLinkIcon, FileTextIcon, GripVerticalIcon, Loader2Icon, MessageSquareTextIcon, Trash2Icon } from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import { getImageSrc } from "@/lib/helpers/image"
import {
  ADD_APPLICATION_NOTE,
  DELETE_APPLICATION_NOTE,
  GET_APPLICATION_NOTES,
  GET_COMPANY_APPLICATIONS,
  GET_MY_COMPANY_JOBS,
  SET_APPLICATION_STATUS,
} from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ConfirmDialog } from "@/lib/ui/useable-components/confirm-dialog"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { EmptyState, portfolioPath, selectClass, timeAgo, type Application, type ApplicationStatus, type Job } from "../jobs/shared"
import { ApprovedOnly } from "./employer"
import { InterviewDialog } from "./interview"
import { Modal } from "./modal"

type Column = { key: string; label: string; status: ApplicationStatus; holds: ApplicationStatus[]; hint: string; tone: string }

const COLUMNS: Column[] = [
  { key: "applied", label: "Applied", status: "VIEWED", holds: ["SUBMITTED", "VIEWED"], hint: "New applications", tone: "bg-sky-500" },
  { key: "shortlist", label: "Shortlist", status: "SHORTLISTED", holds: ["SHORTLISTED"], hint: "The student is emailed", tone: "bg-amber-500" },
  { key: "interview", label: "Interview", status: "INTERVIEW", holds: ["INTERVIEW"], hint: "Booking an interview moves them here", tone: "bg-violet-500" },
  { key: "offer", label: "Offer", status: "OFFER", holds: ["OFFER"], hint: "The student is emailed", tone: "bg-teal-500" },
  { key: "hired", label: "Hired", status: "HIRED", holds: ["HIRED"], hint: "Counts as a placement", tone: "bg-emerald-500" },
  { key: "rejected", label: "Not selected", status: "REJECTED", holds: ["REJECTED"], hint: "The student is told politely", tone: "bg-rose-500" },
]

const columnOf = (status: ApplicationStatus) => COLUMNS.find((c) => c.holds.includes(status)) ?? COLUMNS[0]

type Note = { id: string; text: string; authorName: string; mine: boolean; createdAt: string }

/* ------------------------------------------------------------------ notes */

function NotesDialog({ app, onClose }: { app: Application | null; onClose: () => void }) {
  return (
    <Modal
      open={!!app}
      onOpenChange={(o) => !o && onClose()}
      title={`Team notes: ${app?.student?.fullName ?? "applicant"}`}
      description="Only people on your company's account see these. The student doesn't."
    >
      {app && <Notes applicationId={app.id} />}
    </Modal>
  )
}

function Notes({ applicationId }: { applicationId: string }) {
  const { data, loading } = useQuery<{ applicationNotes: Note[] }>(GET_APPLICATION_NOTES, {
    variables: { applicationId },
    fetchPolicy: "cache-and-network",
  })
  const [text, setText] = useState("")
  const refetchQueries = [GET_APPLICATION_NOTES, GET_COMPANY_APPLICATIONS]
  const [add, { loading: adding }] = useMutation(ADD_APPLICATION_NOTE, { refetchQueries })
  const [remove] = useMutation(DELETE_APPLICATION_NOTE, { refetchQueries })
  const notes = data?.applicationNotes ?? []

  const save = async () => {
    const t = text.trim()
    if (!t) return
    try {
      await add({ variables: { applicationId, text: t } })
      setText("")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save the note")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="e.g. Strong React answers on the call. Ask about notice period."
          aria-label="New note"
        />
        <Button size="sm" disabled={adding || !text.trim()} onClick={() => void save()}>
          {adding && <Loader2Icon className="size-4 animate-spin" />} Add note
        </Button>
      </div>
      {loading && !data ? (
        <p className="text-muted-foreground text-sm">Loading notes…</p>
      ) : !notes.length ? (
        <p className="text-muted-foreground text-sm">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border p-3 text-sm">
              <div className="text-muted-foreground mb-1 flex items-center justify-between gap-2 text-xs">
                <span>
                  {n.authorName} · {timeAgo(n.createdAt)}
                </span>
                {n.mine && (
                  <button
                    type="button"
                    aria-label="Delete note"
                    className="hover:text-foreground p-1"
                    onClick={() => void remove({ variables: { id: n.id } }).catch((e: Error) => toast.error(e.message))}
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line">{n.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ card */

function PipelineCard({
  app,
  showJob,
  busy,
  onMove,
  onNotes,
  onSchedule,
}: {
  app: Application
  showJob: boolean
  busy: boolean
  onMove: (app: Application, to: Column) => void
  onNotes: (app: Application) => void
  onSchedule: (app: Application) => void
}) {
  const s = app.student
  const avatar = getImageSrc(s?.profilePicture)
  const current = columnOf(app.status)
  return (
    <div
      draggable={!busy}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", app.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      className={cn("bg-card cursor-grab rounded-lg border p-3 shadow-xs active:cursor-grabbing", busy && "opacity-60")}
    >
      <div className="flex items-start gap-2">
        <GripVerticalIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="bg-muted size-8 shrink-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar && <img src={avatar} alt="" className="size-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{s?.fullName ?? "Student"}</p>
          {showJob && app.job && <p className="text-muted-foreground truncate text-xs">{app.job.title}</p>}
          <p className="text-muted-foreground text-xs">
            Applied {timeAgo(app.createdAt)}
            {app.status === "SUBMITTED" && <span className="ml-1 font-medium text-sky-600">· new</span>}
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {s?.portfolioSlug && (
          <Link href={portfolioPath(s.portfolioSlug)} target="_blank" className="inline-flex items-center gap-1 font-medium text-(--site-accent)">
            <ExternalLinkIcon className="size-3.5" /> Portfolio
          </Link>
        )}
        {app.cvUrl && (
          <a href={app.cvUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium">
            <FileTextIcon className="size-3.5" /> CV
          </a>
        )}
        <button type="button" onClick={() => onNotes(app)} className="hover:text-foreground text-muted-foreground inline-flex items-center gap-1">
          <MessageSquareTextIcon className="size-3.5" /> {app.notesCount ? `${app.notesCount} note${app.notesCount === 1 ? "" : "s"}` : "Notes"}
        </button>
        {app.status !== "REJECTED" && app.status !== "HIRED" && (
          <button type="button" onClick={() => onSchedule(app)} className="hover:text-foreground text-muted-foreground inline-flex items-center gap-1">
            <CalendarPlusIcon className="size-3.5" /> Interview
          </button>
        )}
      </div>
      {/* Keyboard and touch users can't drag: a plain select does the same. */}
      <select
        aria-label={`Move ${s?.fullName ?? "applicant"} to`}
        className={cn(selectClass, "mt-2 h-8 text-xs")}
        value={current.key}
        disabled={busy}
        onChange={(e) => {
          const to = COLUMNS.find((c) => c.key === e.target.value)
          if (to) onMove(app, to)
        }}
      >
        {COLUMNS.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/* ------------------------------------------------------------------ board */

function Board() {
  const [jobId, setJobId] = useState("")
  const [showRejected, setShowRejected] = useState(false)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notesFor, setNotesFor] = useState<Application | null>(null)
  const [scheduleFor, setScheduleFor] = useState<Application | null>(null)
  const [confirmReject, setConfirmReject] = useState<Application | null>(null)

  const { data: jobsData } = useQuery<{ myCompanyJobs: Job[] }>(GET_MY_COMPANY_JOBS)
  const { data, loading, error, refetch } = useQuery<{ companyApplications: Application[] }>(GET_COMPANY_APPLICATIONS, {
    variables: { jobId: jobId || null },
    fetchPolicy: "cache-and-network",
  })
  const [setStatus] = useMutation(SET_APPLICATION_STATUS)

  const jobs = (jobsData?.myCompanyJobs ?? []).filter((j) => j.source !== "FEED")
  const apps = data?.companyApplications ?? []
  const columns = COLUMNS.filter((c) => showRejected || c.key !== "rejected")

  const move = async (app: Application, to: Column, confirmed = false) => {
    if (to.holds.includes(app.status)) return
    if (to.status === "REJECTED" && !confirmed) {
      setConfirmReject(app)
      return
    }
    setBusyId(app.id)
    try {
      await setStatus({ variables: { id: app.id, status: to.status } })
      toast.success(
        ["SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"].includes(to.status)
          ? `Moved to ${to.label}. The student was emailed.`
          : `Moved to ${to.label}`
      )
    } catch (e) {
      toast.error((e as Error).message || "Couldn't move it")
    } finally {
      setBusyId(null)
    }
  }

  const onDrop = (to: Column, id: string) => {
    setOverColumn(null)
    const app = apps.find((a) => a.id === id)
    if (app) void move(app, to)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hiring pipeline</h1>
          <p className="text-muted-foreground text-sm">
            Drag applicants between stages, or use the menu on each card. Notes are shared with everyone on your company&apos;s account.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select aria-label="Job" className={cn(selectClass, "w-56")} value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">All jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
                {j.status !== "OPEN" ? ` (${j.status.toLowerCase()})` : ""}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} /> Show not selected
          </label>
        </div>
      </div>

      {loading && !data ? (
        <ContentAreaLoader />
      ) : error && !data ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : !apps.length ? (
        <EmptyState title="No applications yet">
          <p className="text-muted-foreground mt-1 text-sm">When students apply to your jobs, they show up here.</p>
        </EmptyState>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
          {columns.map((col) => {
            const items = apps.filter((a) => col.holds.includes(a.status))
            return (
              <section
                key={col.key}
                aria-label={col.label}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  if (overColumn !== col.key) setOverColumn(col.key)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverColumn(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  onDrop(col, e.dataTransfer.getData("text/plain"))
                }}
                className={cn(
                  "bg-muted/40 flex w-64 shrink-0 flex-col rounded-xl border p-2 transition-colors",
                  overColumn === col.key && "border-(--site-accent) bg-(--site-accent)/5"
                )}
              >
                <header className="mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", col.tone)} />
                    <h2 className="text-sm font-semibold">{col.label}</h2>
                    <span className="text-muted-foreground ml-auto text-xs">{items.length}</span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">{col.hint}</p>
                </header>
                <div className="flex min-h-24 flex-1 flex-col gap-2">
                  {items.map((app) => (
                    <PipelineCard
                      key={app.id}
                      app={app}
                      showJob={!jobId}
                      busy={busyId === app.id}
                      onMove={(a, to) => void move(a, to)}
                      onNotes={setNotesFor}
                      onSchedule={setScheduleFor}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <NotesDialog app={notesFor} onClose={() => setNotesFor(null)} />
      <InterviewDialog
        target={scheduleFor ? { kind: "application", applicationId: scheduleFor.id, studentName: scheduleFor.student?.fullName ?? "the student" } : null}
        onClose={() => setScheduleFor(null)}
        // Booking an interview moves the application to Interview on the server.
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={!!confirmReject}
        onOpenChange={(o) => !o && setConfirmReject(null)}
        title="Mark as not selected?"
        description={`${confirmReject?.student?.fullName ?? "The student"} will be told they weren't selected for this job.`}
        confirmLabel="Not selected"
        variant="destructive"
        onConfirm={() => {
          const app = confirmReject
          setConfirmReject(null)
          if (app) void move(app, COLUMNS[COLUMNS.length - 1], true)
        }}
      />
    </div>
  )
}

export function EmployerPipelineScreen() {
  return (
    <ApprovedOnly>
      <Board />
    </ApprovedOnly>
  )
}
