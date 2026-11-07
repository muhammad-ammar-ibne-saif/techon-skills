"use client"

import { useState } from "react"
import Link from "next/link"
import { gql } from "@apollo/client"
import { useMutation, useQuery } from "@apollo/client/react"
import { BookmarkCheckIcon, BookmarkIcon, CalendarPlusIcon, ExternalLinkIcon, GraduationCapIcon, Loader2Icon, SearchIcon, SendIcon } from "lucide-react"
import toast from "react-hot-toast"

import { getImageSrc } from "@/lib/helpers/image"
import {
  GET_CANDIDATES,
  GET_COMPANY_INTERVIEWS,
  GET_MY_COMPANY_JOBS,
  GET_MY_SHORTLIST,
  INVITE_CANDIDATE,
  REMOVE_FROM_SHORTLIST,
  SHORTLIST_CANDIDATE,
} from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { CONFIG } from "@/utils/constants"
import { PendingNotice, useMyCompany } from "../jobs/employer"
import { EmptyState, Field, Pill, portfolioPath, selectClass, type Job } from "../jobs/shared"
import { CompanyInterviewCard, InterviewDialog, isUpcoming, type Interview } from "./interview"
import { Modal } from "./modal"

const PAGE_SIZE = 20

const COURSE_OPTIONS = gql`
  query GetCandidateCourseOptions {
    getCourses {
      id
      title
    }
  }
`

export type Candidate = {
  id: string
  fullName: string
  profilePicture: string
  headline: string
  location: string
  portfolioSlug: string
  skills: string[]
  projects: { title: string; tech: string[] }[]
  projectCount: number
  courses: string[]
  certificates: string[]
  isAlumni: boolean
  shortlisted: boolean
  shortlistNote: string
  invitedJobIds: string[]
  updatedAt: string
}

/** Wraps a screen so it only shows for an approved company. */
export function ApprovedOnly({ children }: { children: React.ReactNode }) {
  const { company, loading } = useMyCompany()
  if (loading) return <ContentAreaLoader />
  if (!company) return <EmptyState title="Your account isn't linked to a company" />
  if (company.status !== "APPROVED") return <PendingNotice company={company} />
  return <>{children}</>
}

function useOpenJobs() {
  const { data } = useQuery<{ myCompanyJobs: Job[] }>(GET_MY_COMPANY_JOBS)
  return (data?.myCompanyJobs ?? []).filter((j) => j.status === "OPEN" && j.source !== "FEED")
}

/* ------------------------------------------------------------------ candidate card */

function CandidateCard({
  c,
  openJobs,
  onInvite,
  onSchedule,
}: {
  c: Candidate
  openJobs: Job[]
  onInvite: (c: Candidate) => void
  onSchedule: (c: Candidate) => void
}) {
  const [save, { loading: saving }] = useMutation(SHORTLIST_CANDIDATE, { refetchQueries: ["GetMyShortlist"] })
  const [unsave, { loading: removing }] = useMutation(REMOVE_FROM_SHORTLIST, { refetchQueries: ["GetMyShortlist", "GetCandidates"] })
  const [note, setNote] = useState(c.shortlistNote)
  const [editingNote, setEditingNote] = useState(false)
  const avatar = getImageSrc(c.profilePicture)
  const invitable = openJobs.filter((j) => !c.invitedJobIds.includes(j.id))

  const toggle = async () => {
    try {
      if (c.shortlisted) await unsave({ variables: { studentId: c.id } })
      else await save({ variables: { studentId: c.id } })
    } catch (e) {
      toast.error((e as Error).message || "Couldn't update the shortlist")
    }
  }
  const saveNote = async () => {
    try {
      await save({ variables: { studentId: c.id, note: note.trim() } })
      setEditingNote(false)
      toast.success("Note saved")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save the note")
    }
  }

  return (
    <div className="bg-card flex flex-col rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar && <img src={avatar} alt="" className="size-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{c.fullName}</p>
            {c.isAlumni && (
              <Pill className="inline-flex items-center gap-1">
                <GraduationCapIcon className="size-3" /> Graduate
              </Pill>
            )}
          </div>
          {c.headline && <p className="text-muted-foreground text-sm">{c.headline}</p>}
          {c.location && <p className="text-muted-foreground text-xs">{c.location}</p>}
        </div>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={saving || removing}
          aria-label={c.shortlisted ? "Remove from shortlist" : "Add to shortlist"}
          title={c.shortlisted ? "Remove from shortlist" : "Add to shortlist"}
          className="text-muted-foreground hover:text-foreground"
        >
          {c.shortlisted ? <BookmarkCheckIcon className="size-5 text-(--site-accent)" /> : <BookmarkIcon className="size-5" />}
        </button>
      </div>

      {c.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {c.skills.slice(0, 12).map((s) => (
            <span key={s} className="rounded-md border px-1.5 py-0.5 font-mono text-[11px]">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="text-muted-foreground mt-3 space-y-1 text-xs">
        {c.courses.length > 0 && <p>Courses: {c.courses.join(", ")}</p>}
        {c.certificates.length > 0 && <p>Certificates: {c.certificates.join(", ")}</p>}
        {c.projectCount > 0 && (
          <p>
            Projects: {c.projects.map((p) => p.title).join(", ")}
            {c.projectCount > c.projects.length && ` and ${c.projectCount - c.projects.length} more`}
          </p>
        )}
      </div>

      {c.shortlisted && (
        <div className="mt-3">
          {editingNote ? (
            <div className="space-y-2">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="Private note for your team" />
              <div className="flex gap-2">
                <Button size="sm" disabled={saving} onClick={() => void saveNote()}>
                  Save note
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingNote(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" className="text-muted-foreground hover:text-foreground text-left text-xs" onClick={() => setEditingNote(true)}>
              {c.shortlistNote ? `Note: ${c.shortlistNote}` : "+ Add a private note"}
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
        <Link href={portfolioPath(c.portfolioSlug)} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-(--site-accent)">
          <ExternalLinkIcon className="size-4" /> Portfolio
        </Link>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInvite(c)}
            disabled={!invitable.length}
            title={!openJobs.length ? "Post an open job first" : !invitable.length ? "Already invited to all your open jobs" : undefined}
          >
            <SendIcon className="size-4" /> Invite to apply
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSchedule(c)}>
            <CalendarPlusIcon className="size-4" /> Interview
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ invite dialog */

function InviteDialog({ candidate, openJobs, onClose }: { candidate: Candidate | null; openJobs: Job[]; onClose: () => void }) {
  return (
    <Modal
      open={!!candidate}
      onOpenChange={(o) => !o && onClose()}
      title="Invite to apply"
      description={candidate ? `${candidate.fullName} gets a notification and an email with a link to the job.` : undefined}
    >
      {candidate && <InviteForm key={candidate.id} candidate={candidate} openJobs={openJobs} onDone={onClose} />}
    </Modal>
  )
}

function InviteForm({ candidate, openJobs, onDone }: { candidate: Candidate; openJobs: Job[]; onDone: () => void }) {
  const jobs = openJobs.filter((j) => !candidate.invitedJobIds.includes(j.id))
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "")
  const [message, setMessage] = useState("")
  const [invite, { loading }] = useMutation(INVITE_CANDIDATE, { refetchQueries: ["GetCandidates", "GetMyShortlist"] })
  const submit = async () => {
    try {
      await invite({ variables: { studentId: candidate.id, jobId, message: message.trim() || null } })
      toast.success("Invite sent")
      onDone()
    } catch (e) {
      toast.error((e as Error).message || "Couldn't send the invite")
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
      <Field label="Job">
        <select value={jobId} onChange={(e) => setJobId(e.target.value)} className={selectClass} required>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Message" hint="Optional. Why you think they'd fit.">
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={1000} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !jobId}>
          {loading && <Loader2Icon className="size-4 animate-spin" />}
          Send invite
        </Button>
      </div>
    </form>
  )
}

/** Shared state for the invite and interview dialogs on a list of candidates. */
function useCandidateActions() {
  const openJobs = useOpenJobs()
  const [inviting, setInviting] = useState<Candidate | null>(null)
  const [scheduling, setScheduling] = useState<Candidate | null>(null)
  const dialogs = (
    <>
      <InviteDialog candidate={inviting} openJobs={openJobs} onClose={() => setInviting(null)} />
      <InterviewDialog
        target={
          scheduling
            ? { kind: "candidate", studentId: scheduling.id, studentName: scheduling.fullName, jobs: openJobs.map((j) => ({ id: j.id, title: j.title })) }
            : null
        }
        onClose={() => setScheduling(null)}
      />
    </>
  )
  return { openJobs, onInvite: setInviting, onSchedule: setScheduling, dialogs }
}

/* ------------------------------------------------------------------ candidates */

export function EmployerCandidatesScreen() {
  return (
    <ApprovedOnly>
      <Candidates />
    </ApprovedOnly>
  )
}

function Candidates() {
  const [draft, setDraft] = useState({ search: "", skills: "", courseId: "", alumniOnly: false })
  const [filter, setFilter] = useState(draft)
  const [page, setPage] = useState(1)
  const { data: courseData } = useQuery<{ getCourses: { id: string; title: string }[] }>(COURSE_OPTIONS)
  const skills = filter.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const { data, loading } = useQuery<{ candidates: { total: number; items: Candidate[] } }>(GET_CANDIDATES, {
    variables: {
      filter: { search: filter.search.trim() || null, skills: skills.length ? skills : null, courseId: filter.courseId || null, alumniOnly: filter.alumniOnly },
      page,
      limit: PAGE_SIZE,
    },
    fetchPolicy: "cache-and-network",
  })
  const actions = useCandidateActions()
  const items = data?.candidates.items ?? []
  const total = data?.candidates.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Find talent</h1>
        <p className="text-muted-foreground text-sm">Students and graduates who are open to work. Invite them to apply or book an interview.</p>
      </div>
      <form
        className="bg-card grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_14rem_auto_auto] lg:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setFilter(draft)
        }}
      >
        <Field label="Search">
          <Input value={draft.search} onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))} placeholder="Name or headline" />
        </Field>
        <Field label="Skills">
          <Input value={draft.skills} onChange={(e) => setDraft((d) => ({ ...d, skills: e.target.value }))} placeholder="React, Node.js" />
        </Field>
        <Field label="Course">
          <select value={draft.courseId} onChange={(e) => setDraft((d) => ({ ...d, courseId: e.target.value }))} className={selectClass}>
            <option value="">Any course</option>
            {(courseData?.getCourses ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex h-9 items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.alumniOnly} onChange={(e) => setDraft((d) => ({ ...d, alumniOnly: e.target.checked }))} />
          Graduates only
        </label>
        <Button type="submit">
          <SearchIcon className="size-4" /> Search
        </Button>
      </form>

      {loading && !data ? (
        <ContentAreaLoader />
      ) : !items.length ? (
        <EmptyState title="No one matches yet">Try fewer skills or a different course.</EmptyState>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "person" : "people"}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((c) => (
              <CandidateCard key={c.id} c={c} openJobs={actions.openJobs} onInvite={actions.onInvite} onSchedule={actions.onSchedule} />
            ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
      {actions.dialogs}
    </div>
  )
}

/* ------------------------------------------------------------------ shortlist */

export function EmployerShortlistScreen() {
  return (
    <ApprovedOnly>
      <Shortlist />
    </ApprovedOnly>
  )
}

function Shortlist() {
  const { data, loading } = useQuery<{ myShortlist: { note: string; createdAt: string; candidate: Candidate }[] }>(GET_MY_SHORTLIST, {
    fetchPolicy: "cache-and-network",
  })
  const actions = useCandidateActions()
  const items = data?.myShortlist ?? []
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shortlist</h1>
        <p className="text-muted-foreground text-sm">People you saved. Only your company sees this list and your notes.</p>
      </div>
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !items.length ? (
        <EmptyState title="Your shortlist is empty">
          Save people from{" "}
          <Link href={CONFIG.ROUTES.EMPLOYER.CANDIDATES} className="text-(--site-accent)">
            Find talent
          </Link>
          .
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((e) => (
            <CandidateCard key={e.candidate.id} c={e.candidate} openJobs={actions.openJobs} onInvite={actions.onInvite} onSchedule={actions.onSchedule} />
          ))}
        </div>
      )}
      {actions.dialogs}
    </div>
  )
}

/* ------------------------------------------------------------------ interviews */

export function EmployerInterviewsScreen() {
  return (
    <ApprovedOnly>
      <CompanyInterviews />
    </ApprovedOnly>
  )
}

function CompanyInterviews() {
  const { data, loading } = useQuery<{ companyInterviews: Interview[] }>(GET_COMPANY_INTERVIEWS, { fetchPolicy: "cache-and-network" })
  const [editing, setEditing] = useState<Interview | null>(null)
  const all = data?.companyInterviews ?? []
  const upcoming = all.filter((i) => isUpcoming(i) && i.status !== "CANCELLED").sort((a, b) => a.startAt.localeCompare(b.startAt))
  const rest = all.filter((i) => !upcoming.includes(i))
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Interviews</h1>
        <p className="text-muted-foreground text-sm">
          Book interviews from an applicant or from Find talent. Students accept or decline here and get a reminder the day before.
        </p>
      </div>
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !all.length ? (
        <EmptyState title="No interviews yet" />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-semibold">Coming up</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcoming.map((iv) => (
                  <CompanyInterviewCard key={iv.id} iv={iv} onEdit={setEditing} />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-muted-foreground font-semibold">Earlier and cancelled</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {rest.map((iv) => (
                  <CompanyInterviewCard key={iv.id} iv={iv} onEdit={setEditing} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      <InterviewDialog target={editing ? { kind: "edit", interview: editing } : null} onClose={() => setEditing(null)} />
    </div>
  )
}
