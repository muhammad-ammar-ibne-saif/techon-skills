"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  ArrowLeftIcon,
  CalendarIcon,
  CalendarPlusIcon,
  ExternalLinkIcon,
  GithubIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import { getImageSrc } from "@/lib/helpers/image"
import {
  ADD_SUBMISSION_TO_PORTFOLIO,
  CLOSE_SPONSORED_PROJECT,
  CREATE_SPONSORED_PROJECT,
  GET_ADMIN_SPONSORED_PROJECTS,
  GET_COURSE_OPTIONS,
  GET_MY_COMPANY_JOBS,
  GET_MY_COMPANY_PROJECTS,
  GET_MY_PROJECT_SUBMISSIONS,
  GET_OPEN_SPONSORED_PROJECTS,
  GET_PROJECT_SUBMISSIONS,
  GET_SPONSORED_PROJECT,
  REVIEW_PROJECT_SUBMISSION,
  REVIEW_SPONSORED_PROJECT,
  SUBMIT_PROJECT_WORK,
  UPDATE_SPONSORED_PROJECT,
  WITHDRAW_PROJECT_WORK,
} from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ConfirmDialog } from "@/lib/ui/useable-components/confirm-dialog"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { CONFIG } from "@/utils/constants"
import { CompanyLogo, EmptyState, Field, Pill, portfolioPath, selectClass, timeAgo, type Job } from "../jobs/shared"
import { ApprovedOnly } from "./employer"
import { InterviewDialog } from "./interview"
import { Modal } from "./modal"

/* ------------------------------------------------------------------ types */

export type ProjectStatus = "PENDING" | "OPEN" | "CLOSED" | "REJECTED"
export type SubmissionStatus = "SUBMITTED" | "REVIEWED" | "STANDOUT"

export type Submission = {
  id: string
  repoUrl: string
  demoUrl: string
  note: string
  status: SubmissionStatus
  feedback: string
  reviewedAt: string | null
  addedToPortfolio: boolean
  createdAt: string
  updatedAt: string
  student?: { id: string; fullName: string; profilePicture: string; portfolioSlug: string | null } | null
  project?: { id: string; title: string; companyName: string; companyLogo: string; status: ProjectStatus; deadline: string | null } | null
}

export type SponsoredProject = {
  id: string
  title: string
  brief: string
  deliverables: string
  skills: string[]
  courseIds: string[]
  courses: string[]
  deadline: string | null
  status: ProjectStatus
  reviewNote: string | null
  companyName: string
  companyLogo: string
  companySlug: string | null
  submissionsCount: number | null
  acceptingWork: boolean
  approvedAt: string | null
  createdAt: string
  mySubmission?: Submission | null
}

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PENDING: "Waiting for approval",
  OPEN: "Open",
  CLOSED: "Closed",
  REJECTED: "Not approved",
}
const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  OPEN: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  CLOSED: "bg-muted text-muted-foreground",
  REJECTED: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
}
const SUBMISSION_LABEL: Record<SubmissionStatus, string> = { SUBMITTED: "Handed in", REVIEWED: "Reviewed", STANDOUT: "Standout" }
const SUBMISSION_CLASS: Record<SubmissionStatus, string> = {
  SUBMITTED: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  REVIEWED: "bg-muted text-muted-foreground",
  STANDOUT: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
}

const formatDeadline = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""

const studentProjectPath = (id: string) => `${CONFIG.ROUTES.STUDENT.PROJECTS}/${id}`

function ExternalLinks({ s }: { s: Pick<Submission, "repoUrl" | "demoUrl"> }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {s.repoUrl && (
        <a href={s.repoUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-(--site-accent)">
          <GithubIcon className="size-4" /> Code
        </a>
      )}
      {s.demoUrl && (
        <a href={s.demoUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-(--site-accent)">
          <ExternalLinkIcon className="size-4" /> Live demo
        </a>
      )}
    </div>
  )
}

function ProjectBrief({ p }: { p: SponsoredProject }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="whitespace-pre-line">{p.brief}</p>
      {p.deliverables && (
        <div>
          <p className="font-medium">What to hand in</p>
          <p className="text-muted-foreground whitespace-pre-line">{p.deliverables}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {p.skills.map((s) => (
          <Pill key={s}>{s}</Pill>
        ))}
      </div>
      <p className="text-muted-foreground">
        {p.courses.length ? `For students of ${p.courses.join(", ")}` : "For every student"}
        {p.deadline && ` · Hand in by ${formatDeadline(p.deadline)}`}
      </p>
    </div>
  )
}

/* ================================================================== company */

type ProjectForm = { title: string; brief: string; deliverables: string; skills: string; courseIds: string[]; deadline: string }

function ProjectFormDialog({ project, open, onClose }: { project: SponsoredProject | null; open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={project ? "Edit project" : "Post a project"}
      description="A small, real task students can build in a week or two as part of their course. Our team checks it before students see it."
    >
      {open && <ProjectFormBody key={project?.id ?? "new"} project={project} onDone={onClose} />}
    </Modal>
  )
}

function ProjectFormBody({ project, onDone }: { project: SponsoredProject | null; onDone: () => void }) {
  const [form, setForm] = useState<ProjectForm>({
    title: project?.title ?? "",
    brief: project?.brief ?? "",
    deliverables: project?.deliverables ?? "",
    skills: project?.skills.join(", ") ?? "",
    courseIds: project?.courseIds ?? [],
    deadline: project?.deadline ?? "",
  })
  const { data: coursesData } = useQuery<{ getCourses: { id: string; title: string }[] }>(GET_COURSE_OPTIONS)
  const [create, { loading: creating }] = useMutation(CREATE_SPONSORED_PROJECT, { refetchQueries: [GET_MY_COMPANY_PROJECTS] })
  const [update, { loading: updating }] = useMutation(UPDATE_SPONSORED_PROJECT, { refetchQueries: [GET_MY_COMPANY_PROJECTS] })
  const set = (k: "title" | "brief" | "deliverables" | "skills" | "deadline") => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleCourse = (id: string) =>
    setForm((f) => ({ ...f, courseIds: f.courseIds.includes(id) ? f.courseIds.filter((c) => c !== id) : [...f.courseIds, id] }))

  const save = async () => {
    const input = {
      title: form.title.trim(),
      brief: form.brief.trim(),
      deliverables: form.deliverables.trim(),
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      courseIds: form.courseIds,
      deadline: form.deadline || null,
    }
    if (!input.title || !input.brief) {
      toast.error("Add a title and a brief")
      return
    }
    try {
      if (project) await update({ variables: { id: project.id, input } })
      else await create({ variables: { input } })
      toast.success(project ? "Saved. It goes back to our team for a quick check." : "Sent. We'll check it and open it to students soon.")
      onDone()
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save")
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Title">
        <Input value={form.title} onChange={set("title")} maxLength={120} placeholder="e.g. Build a booking page for a clinic" />
      </Field>
      <Field label="Brief" hint="The problem, who it's for, and what good looks like.">
        <Textarea value={form.brief} onChange={set("brief")} rows={5} maxLength={5000} />
      </Field>
      <Field label="What to hand in" hint="e.g. A GitHub repo with a README and a live link.">
        <Textarea value={form.deliverables} onChange={set("deliverables")} rows={3} maxLength={2000} />
      </Field>
      <Field label="Skills" hint="Comma separated.">
        <Input value={form.skills} onChange={set("skills")} placeholder="React, Tailwind, REST APIs" />
      </Field>
      <div className="space-y-1">
        <p className="text-sm font-medium">Courses</p>
        <p className="text-muted-foreground text-xs">Leave all unticked to offer it to every student.</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {(coursesData?.getCourses ?? []).map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.courseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} /> {c.title}
            </label>
          ))}
        </div>
      </div>
      <Field label="Deadline (optional)">
        <Input type="date" value={form.deadline} onChange={set("deadline")} />
      </Field>
      <Button disabled={creating || updating} onClick={() => void save()}>
        {(creating || updating) && <Loader2Icon className="size-4 animate-spin" />} {project ? "Save changes" : "Send for approval"}
      </Button>
    </div>
  )
}

function SubmissionReview({ sub, onInvite }: { sub: Submission; onInvite?: (sub: Submission) => void }) {
  const [status, setStatus] = useState<SubmissionStatus>(sub.status === "SUBMITTED" ? "REVIEWED" : sub.status)
  const [feedback, setFeedback] = useState(sub.feedback)
  const [review, { loading }] = useMutation(REVIEW_PROJECT_SUBMISSION, { refetchQueries: [GET_PROJECT_SUBMISSIONS] })
  const s = sub.student
  const avatar = getImageSrc(s?.profilePicture)

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-muted size-9 shrink-0 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar && <img src={avatar} alt="" className="size-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{s?.fullName ?? "Student"}</p>
          <p className="text-muted-foreground text-xs">Handed in {timeAgo(sub.updatedAt)}</p>
        </div>
        <Pill className={SUBMISSION_CLASS[sub.status]}>{SUBMISSION_LABEL[sub.status]}</Pill>
      </div>
      <div className="mt-3 space-y-2">
        <ExternalLinks s={sub} />
        {sub.note && <p className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-line">{sub.note}</p>}
        {s?.portfolioSlug && (
          <Link href={portfolioPath(s.portfolioSlug)} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium">
            <ExternalLinkIcon className="size-4" /> Portfolio
          </Link>
        )}
      </div>
      {onInvite && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Result"
              className={cn(selectClass, "w-44")}
              value={status}
              onChange={(e) => setStatus(e.target.value as SubmissionStatus)}
            >
              <option value="REVIEWED">Reviewed</option>
              <option value="STANDOUT">Standout</option>
            </select>
            <Button size="sm" variant="ghost" onClick={() => onInvite(sub)}>
              <CalendarPlusIcon className="size-4" /> Invite to interview
            </Button>
          </div>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Feedback for the student: what worked, what to improve."
            aria-label="Feedback"
          />
          <Button
            size="sm"
            disabled={loading}
            onClick={() =>
              void review({ variables: { id: sub.id, status, feedback: feedback.trim() || null } })
                .then(() => toast.success("Feedback sent to the student"))
                .catch((e: Error) => toast.error(e.message))
            }
          >
            {loading && <Loader2Icon className="size-4 animate-spin" />} {sub.reviewedAt ? "Update feedback" : "Send feedback"}
          </Button>
        </div>
      )}
      {!onInvite && sub.feedback && <p className="mt-3 border-t pt-3 text-sm">Company feedback: {sub.feedback}</p>}
    </div>
  )
}

function SubmissionsDialog({
  project,
  onClose,
  canReview,
}: {
  project: SponsoredProject | null
  onClose: () => void
  canReview: boolean
}) {
  return (
    <Modal
      open={!!project}
      onOpenChange={(o) => !o && onClose()}
      title={project ? `Work for: ${project.title}` : "Submissions"}
      description={canReview ? "Students see your feedback. Mark the best work as Standout." : undefined}
    >
      {project && <SubmissionsList projectId={project.id} canReview={canReview} />}
    </Modal>
  )
}

function SubmissionsList({ projectId, canReview }: { projectId: string; canReview: boolean }) {
  const { data, loading } = useQuery<{ projectSubmissions: Submission[] }>(GET_PROJECT_SUBMISSIONS, {
    variables: { projectId },
    fetchPolicy: "cache-and-network",
  })
  const { data: jobsData } = useQuery<{ myCompanyJobs: Job[] }>(GET_MY_COMPANY_JOBS, { skip: !canReview })
  const [inviting, setInviting] = useState<Submission | null>(null)
  const jobs = (jobsData?.myCompanyJobs ?? []).filter((j) => j.status === "OPEN" && j.source !== "FEED").map((j) => ({ id: j.id, title: j.title }))
  const subs = data?.projectSubmissions ?? []

  if (loading && !data) return <p className="text-muted-foreground text-sm">Loading…</p>
  if (!subs.length) return <p className="text-muted-foreground text-sm">Nothing handed in yet.</p>
  return (
    <div className="space-y-3">
      {subs.map((s) => (
        <SubmissionReview key={s.id} sub={s} onInvite={canReview ? setInviting : undefined} />
      ))}
      <InterviewDialog
        target={
          inviting?.student
            ? { kind: "candidate", studentId: inviting.student.id, studentName: inviting.student.fullName, jobs }
            : null
        }
        onClose={() => setInviting(null)}
      />
    </div>
  )
}

function CompanyProjects() {
  const { data, loading } = useQuery<{ myCompanyProjects: SponsoredProject[] }>(GET_MY_COMPANY_PROJECTS, { fetchPolicy: "cache-and-network" })
  const [editing, setEditing] = useState<SponsoredProject | null>(null)
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<SponsoredProject | null>(null)
  const [closing, setClosing] = useState<SponsoredProject | null>(null)
  const [close, { loading: closingBusy }] = useMutation(CLOSE_SPONSORED_PROJECT)
  const projects = data?.myCompanyProjects ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sponsored projects</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Set a small real task. Students build it as a course project, you review the work, and invite the best to interview. Students can add
            reviewed work to their portfolios.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <PlusIcon className="size-4" /> Post a project
        </Button>
      </div>

      {loading && !data ? (
        <ContentAreaLoader />
      ) : !projects.length ? (
        <EmptyState title="No projects yet">
          <p className="text-muted-foreground mt-1 text-sm">Post one to see how students approach a real problem from your team.</p>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} className="bg-card flex flex-col rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{p.title}</p>
                <Pill className={PROJECT_STATUS_CLASS[p.status]}>{PROJECT_STATUS_LABEL[p.status]}</Pill>
              </div>
              <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">{p.brief}</p>
              {p.status === "REJECTED" && p.reviewNote && <p className="mt-2 text-sm text-rose-600">Our team: {p.reviewNote}</p>}
              <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <UsersIcon className="size-3.5" /> {p.submissionsCount ?? 0} handed in
                </span>
                {p.deadline && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="size-3.5" /> {formatDeadline(p.deadline)}
                  </span>
                )}
                <span>{p.courses.length ? p.courses.join(", ") : "All courses"}</span>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-3">
                <Button size="sm" variant="outline" onClick={() => setViewing(p)} disabled={!p.submissionsCount}>
                  See work
                </Button>
                {p.status !== "CLOSED" && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                    <PencilIcon className="size-4" /> Edit
                  </Button>
                )}
                {p.status === "OPEN" && (
                  <Button size="sm" variant="ghost" onClick={() => setClosing(p)}>
                    Close
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormDialog project={editing} open={creating || !!editing} onClose={() => (setCreating(false), setEditing(null))} />
      <SubmissionsDialog project={viewing} onClose={() => setViewing(null)} canReview />
      <ConfirmDialog
        open={!!closing}
        onOpenChange={(o) => !o && setClosing(null)}
        title="Close this project?"
        description="Students can't hand in work any more. You can still review what's already in."
        confirmLabel="Close project"
        loading={closingBusy}
        onConfirm={() => {
          const p = closing
          if (!p) return
          void close({ variables: { id: p.id } })
            .then(() => toast.success("Closed"))
            .catch((e: Error) => toast.error(e.message))
            .finally(() => setClosing(null))
        }}
      />
    </div>
  )
}

export function EmployerProjectsScreen() {
  return (
    <ApprovedOnly>
      <CompanyProjects />
    </ApprovedOnly>
  )
}

/* ================================================================== student */

function ProjectCard({ p }: { p: SponsoredProject }) {
  return (
    <Link href={studentProjectPath(p.id)} className="bg-card hover:border-foreground/30 flex flex-col rounded-xl border p-4 transition-colors">
      <div className="flex items-start gap-3">
        <CompanyLogo src={p.companyLogo} name={p.companyName} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{p.title}</p>
          <p className="text-muted-foreground text-sm">{p.companyName}</p>
        </div>
        {p.mySubmission && <Pill className={SUBMISSION_CLASS[p.mySubmission.status]}>{SUBMISSION_LABEL[p.mySubmission.status]}</Pill>}
      </div>
      <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{p.brief}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.skills.slice(0, 5).map((s) => (
          <Pill key={s}>{s}</Pill>
        ))}
      </div>
      {p.deadline && (
        <p className="text-muted-foreground mt-2 inline-flex items-center gap-1 text-xs">
          <CalendarIcon className="size-3.5" /> Hand in by {formatDeadline(p.deadline)}
        </p>
      )}
    </Link>
  )
}

export function StudentProjectsScreen() {
  const { data, loading } = useQuery<{ openSponsoredProjects: SponsoredProject[] }>(GET_OPEN_SPONSORED_PROJECTS, { fetchPolicy: "cache-and-network" })
  const { data: mine } = useQuery<{ mySubmissions: Submission[] }>(GET_MY_PROJECT_SUBMISSIONS, { fetchPolicy: "cache-and-network" })
  const open = data?.openSponsoredProjects ?? []
  const openIds = new Set(open.map((p) => p.id))
  const past = (mine?.mySubmissions ?? []).filter((s) => s.project && !openIds.has(s.project.id))

  return (
    <div className="w-full space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Company projects</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Real tasks from companies that hire our students. Build one as a course project, get feedback from the company, and add it to your
          portfolio. Standout work can lead to an interview.
        </p>
      </div>
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !open.length ? (
        <EmptyState title="No open projects right now">
          <p className="text-muted-foreground mt-1 text-sm">We&apos;ll notify you when a company posts one for your course.</p>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {open.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Your earlier work</h2>
          <div className="space-y-2">
            {past.map((s) => (
              <Link
                key={s.id}
                href={studentProjectPath(s.project!.id)}
                className="bg-card hover:border-foreground/30 flex flex-wrap items-center gap-3 rounded-xl border p-3"
              >
                <CompanyLogo src={s.project!.companyLogo} name={s.project!.companyName} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.project!.title}</p>
                  <p className="text-muted-foreground text-xs">{s.project!.companyName}</p>
                </div>
                <Pill className={SUBMISSION_CLASS[s.status]}>{SUBMISSION_LABEL[s.status]}</Pill>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SubmitForm({ project, onDone }: { project: SponsoredProject; onDone?: () => void }) {
  const sub = project.mySubmission
  const [repoUrl, setRepoUrl] = useState(sub?.repoUrl ?? "")
  const [demoUrl, setDemoUrl] = useState(sub?.demoUrl ?? "")
  const [note, setNote] = useState(sub?.note ?? "")
  const [submit, { loading }] = useMutation(SUBMIT_PROJECT_WORK, { refetchQueries: [GET_SPONSORED_PROJECT, GET_MY_PROJECT_SUBMISSIONS] })

  const save = async () => {
    if (!repoUrl.trim() && !demoUrl.trim()) {
      toast.error("Add a link to your code or a live demo")
      return
    }
    try {
      await submit({
        variables: { projectId: project.id, input: { repoUrl: repoUrl.trim(), demoUrl: demoUrl.trim(), note: note.trim() } },
      })
      toast.success(sub ? "Updated" : "Handed in. The company will review it.")
      onDone?.()
    } catch (e) {
      toast.error((e as Error).message || "Couldn't hand it in")
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Code (GitHub or similar)">
        <Input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/you/project" type="url" />
      </Field>
      <Field label="Live demo">
        <Input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://your-project.vercel.app" type="url" />
      </Field>
      <Field label="Note for the company" hint="What you built, choices you made, what you'd do next.">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={2000} />
      </Field>
      <Button disabled={loading} onClick={() => void save()}>
        {loading && <Loader2Icon className="size-4 animate-spin" />} {sub ? "Save changes" : "Hand in"}
      </Button>
    </div>
  )
}

export function StudentProjectScreen({ id }: { id: string }) {
  const { data, loading, error } = useQuery<{ sponsoredProject: SponsoredProject | null }>(GET_SPONSORED_PROJECT, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  })
  const [editing, setEditing] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [withdraw, { loading: withdrawing }] = useMutation(WITHDRAW_PROJECT_WORK, { refetchQueries: [GET_SPONSORED_PROJECT, GET_MY_PROJECT_SUBMISSIONS] })
  const [addToPortfolio, { loading: adding }] = useMutation(ADD_SUBMISSION_TO_PORTFOLIO)
  const p = data?.sponsoredProject

  if (loading && !data) return <ContentAreaLoader />
  if (!p) return <p className="text-destructive py-10">{error?.message ?? "This project isn't available."}</p>
  const sub = p.mySubmission
  const reviewed = sub && sub.status !== "SUBMITTED"

  return (
    <div className="w-full max-w-3xl space-y-6 py-6">
      <Link href={CONFIG.ROUTES.STUDENT.PROJECTS} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
        <ArrowLeftIcon className="size-4" /> All projects
      </Link>
      <div className="flex items-start gap-3">
        <CompanyLogo src={p.companyLogo} name={p.companyName} className="size-12" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.title}</h1>
          <p className="text-muted-foreground">{p.companyName}</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border p-5">
        <ProjectBrief p={p} />
      </div>

      <section className="bg-card space-y-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Your work</h2>
          {sub && <Pill className={SUBMISSION_CLASS[sub.status]}>{SUBMISSION_LABEL[sub.status]}</Pill>}
        </div>

        {sub?.status === "STANDOUT" && (
          <p className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm">
            <SparklesIcon className="size-4 text-amber-600" /> {p.companyName} marked your work as standout.
          </p>
        )}
        {reviewed && sub.feedback && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">Feedback from {p.companyName}</p>
            <p className="mt-1 whitespace-pre-line">{sub.feedback}</p>
          </div>
        )}

        {sub && !editing ? (
          <div className="space-y-3">
            <ExternalLinks s={sub} />
            {sub.note && <p className="text-muted-foreground text-sm whitespace-pre-line">{sub.note}</p>}
            <div className="flex flex-wrap gap-2">
              {reviewed && !sub.addedToPortfolio && (
                <Button
                  size="sm"
                  disabled={adding}
                  onClick={() =>
                    void addToPortfolio({ variables: { id: sub.id } })
                      .then(() => toast.success("Added to your portfolio projects"))
                      .catch((e: Error) => toast.error(e.message))
                  }
                >
                  {adding && <Loader2Icon className="size-4 animate-spin" />} Add to my portfolio
                </Button>
              )}
              {sub.addedToPortfolio && (
                <Link href={CONFIG.ROUTES.STUDENT.PORTFOLIO} className="inline-flex items-center gap-1 text-sm font-medium text-(--site-accent)">
                  In your portfolio <ExternalLinkIcon className="size-3.5" />
                </Link>
              )}
              {p.acceptingWork && !reviewed && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmWithdraw(true)}>
                    Withdraw
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : p.acceptingWork ? (
          <SubmitForm key={sub?.updatedAt ?? "new"} project={p} onDone={() => setEditing(false)} />
        ) : (
          <p className="text-muted-foreground text-sm">This project isn&apos;t taking work any more.</p>
        )}
      </section>

      <ConfirmDialog
        open={confirmWithdraw}
        onOpenChange={setConfirmWithdraw}
        title="Withdraw your work?"
        description="The company won't see it. You can hand in again before the deadline."
        confirmLabel="Withdraw"
        variant="destructive"
        loading={withdrawing}
        onConfirm={() =>
          void withdraw({ variables: { projectId: p.id } })
            .then(() => toast.success("Withdrawn"))
            .catch((e: Error) => toast.error(e.message))
            .finally(() => setConfirmWithdraw(false))
        }
      />
    </div>
  )
}

/* ================================================================== admin */

function AdminProjectCard({ p, onView }: { p: SponsoredProject; onView: (p: SponsoredProject) => void }) {
  const [note, setNote] = useState("")
  const [review, { loading }] = useMutation(REVIEW_SPONSORED_PROJECT, { refetchQueries: [GET_ADMIN_SPONSORED_PROJECTS] })
  const decide = (approve: boolean) =>
    void review({ variables: { id: p.id, approve, note: note.trim() || null } })
      .then(() => toast.success(approve ? "Approved. Matching students were notified." : "Sent back to the company"))
      .catch((e: Error) => toast.error(e.message))

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <CompanyLogo src={p.companyLogo} name={p.companyName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{p.title}</p>
            <Pill className={PROJECT_STATUS_CLASS[p.status]}>{PROJECT_STATUS_LABEL[p.status]}</Pill>
          </div>
          <p className="text-muted-foreground text-sm">
            {p.companyName} · posted {timeAgo(p.createdAt)} · {p.submissionsCount ?? 0} handed in
          </p>
        </div>
      </div>
      <div className="mt-3">
        <ProjectBrief p={p} />
      </div>
      {p.reviewNote && <p className="text-muted-foreground mt-2 text-sm">Note to company: {p.reviewNote}</p>}
      <div className="mt-3 space-y-2 border-t pt-3">
        {p.status === "PENDING" && (
          <>
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Note for the company (needed if you send it back)" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={loading} onClick={() => decide(true)}>
                Approve and notify students
              </Button>
              <Button size="sm" variant="outline" disabled={loading || !note.trim()} onClick={() => decide(false)}>
                Send back
              </Button>
            </div>
          </>
        )}
        {!!p.submissionsCount && (
          <Button size="sm" variant="ghost" onClick={() => onView(p)}>
            See work
          </Button>
        )}
      </div>
    </div>
  )
}

export function AdminProjectsScreen() {
  const [status, setStatus] = useState<ProjectStatus | "">("PENDING")
  const [viewing, setViewing] = useState<SponsoredProject | null>(null)
  const { data, loading } = useQuery<{ adminSponsoredProjects: SponsoredProject[] }>(GET_ADMIN_SPONSORED_PROJECTS, {
    variables: { status: status || null },
    fetchPolicy: "cache-and-network",
  })
  const projects = data?.adminSponsoredProjects ?? []
  return (
    <div className="w-full space-y-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-secondary text-sm font-semibold">Admin</div>
          <h1 className="text-3xl font-semibold tracking-tight">Sponsored projects</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Check company projects before students see them: a clear brief, a fair size for a student, and nothing that looks like unpaid client work.
          </p>
        </div>
        <select aria-label="Status" className={cn(selectClass, "w-48")} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | "")}>
          <option value="PENDING">Waiting for approval</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Sent back</option>
          <option value="">All</option>
        </select>
      </div>
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !projects.length ? (
        <EmptyState title={status === "PENDING" ? "Nothing waiting" : "No projects"} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((p) => (
            <AdminProjectCard key={p.id} p={p} onView={setViewing} />
          ))}
        </div>
      )}
      <SubmissionsDialog project={viewing} onClose={() => setViewing(null)} canReview={false} />
    </div>
  )
}
