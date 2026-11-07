"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import { BellIcon, CheckIcon, GraduationCapIcon, Loader2Icon, MailIcon, PartyPopperIcon, Trash2Icon } from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import {
  DELETE_INTERVIEW_PRACTICE,
  DELETE_MY_PLACEMENT,
  GET_MY_INTERVIEW_PRACTICES,
  GET_MY_INTERVIEWS,
  GET_MY_JOB_ALERT_SETTINGS,
  GET_MY_JOB_INVITES,
  GET_MY_PLACEMENTS,
  GET_RECOMMENDED_JOBS,
  REPORT_MY_PLACEMENT,
  UPDATE_JOB_ALERT_SETTINGS,
} from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Input } from "@/lib/ui/useable-components/input"
import { CONFIG } from "@/utils/constants"
import { CompanyLogo, EmptyState, Field, JOB_TYPE_LABEL, JobCard, Pill, StatusPill, jobPath, selectClass, timeAgo, type ApplicationStatus, type Job, type JobType } from "../jobs/shared"
import { MyApplicationsList } from "../jobs/student"
import { StudentInterviewCard, isUpcoming, type Interview } from "./interview"
import { FitSummary, practicePath } from "./job-fit"

const ROUTES = CONFIG.ROUTES.STUDENT

export const CAREER_TABS = [
  { key: "for-you", label: "For you" },
  { key: "applications", label: "Applications" },
  { key: "invites", label: "Invites" },
  { key: "interviews", label: "Interviews" },
  { key: "practice", label: "Interview practice" },
] as const
export type CareerTab = (typeof CAREER_TABS)[number]["key"]

export function StudentCareerHub({ tab }: { tab: CareerTab }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs & applications</h1>
          <p className="text-muted-foreground text-sm">Jobs that fit your skills, your applications, invites and interviews.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={ROUTES.PORTFOLIO}>Edit my portfolio</Link>
          </Button>
          <Button asChild>
            <Link href={CONFIG.ROUTES.PUBLIC.JOBS}>Browse all jobs</Link>
          </Button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-b" aria-label="Jobs sections">
        {CAREER_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "for-you" ? ROUTES.JOBS : `${ROUTES.JOBS}?tab=${t.key}`}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap",
              tab === t.key ? "border-(--site-accent) text-foreground" : "text-muted-foreground hover:text-foreground border-transparent"
            )}
            aria-current={tab === t.key ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {tab === "for-you" && <ForYou />}
      {tab === "applications" && <MyApplicationsList />}
      {tab === "invites" && <Invites />}
      {tab === "interviews" && <Interviews />}
      {tab === "practice" && <PracticeList />}
    </div>
  )
}

/* ------------------------------------------------------------------ for you */

function ForYou() {
  const { data, loading } = useQuery<{ recommendedJobs: Job[] }>(GET_RECOMMENDED_JOBS, { variables: { limit: 20 }, fetchPolicy: "cache-and-network" })
  const jobs = data?.recommendedJobs ?? []
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-3">
        <h2 className="font-semibold">Jobs that fit your skills</h2>
        {loading && !data ? (
          <ContentAreaLoader />
        ) : !jobs.length ? (
          <EmptyState title="No matching jobs right now">
            Add your skills and the tech you used in your projects to{" "}
            <Link href={ROUTES.PORTFOLIO} className="text-(--site-accent)">
              your portfolio
            </Link>{" "}
            so we can match you. You can still{" "}
            <Link href={CONFIG.ROUTES.PUBLIC.JOBS} className="text-(--site-accent)">
              browse every job
            </Link>
            .
          </EmptyState>
        ) : (
          jobs.map((j) => <JobCard key={j.id} job={j} href={jobPath(j.id)} actions={j.fit ? <FitSummary fit={j.fit} /> : undefined} />)
        )}
      </div>
      <div className="space-y-4">
        <JobAlertsCard />
        <PlacementCard />
      </div>
    </div>
  )
}

type AlertSettings = { jobAlerts: boolean; jobAlertsEmail: boolean; openToWork: boolean }

function JobAlertsCard() {
  const { data } = useQuery<{ myJobAlertSettings: AlertSettings }>(GET_MY_JOB_ALERT_SETTINGS)
  const [save, { loading }] = useMutation<{ updateJobAlertSettings: AlertSettings }>(UPDATE_JOB_ALERT_SETTINGS, {
    refetchQueries: ["GetMyJobAlertSettings"],
  })
  const s = data?.myJobAlertSettings
  if (!s) return null
  const change = async (next: Partial<AlertSettings>) => {
    try {
      await save({ variables: { jobAlerts: next.jobAlerts ?? s.jobAlerts, jobAlertsEmail: next.jobAlertsEmail ?? s.jobAlertsEmail } })
      toast.success("Saved")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save")
    }
  }
  return (
    <div className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <BellIcon className="size-4" />
        <h3 className="font-semibold">Job alerts</h3>
      </div>
      <p className="text-muted-foreground text-sm">We tell you when a new job matches your portfolio skills.</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={s.jobAlerts} disabled={loading} onChange={(e) => void change({ jobAlerts: e.target.checked })} />
        Alert me about new jobs
      </label>
      <label className={cn("flex items-center gap-2 text-sm", !s.jobAlerts && "opacity-50")}>
        <input
          type="checkbox"
          checked={s.jobAlertsEmail}
          disabled={loading || !s.jobAlerts}
          onChange={(e) => void change({ jobAlertsEmail: e.target.checked })}
        />
        <MailIcon className="size-3.5" /> Also by email (once a day at most)
      </label>
      {!s.openToWork && (
        <p className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300">
          Alerts are paused because your portfolio doesn&apos;t say you&apos;re open to work.{" "}
          <Link href={ROUTES.PORTFOLIO} className="underline">
            Change it
          </Link>
        </p>
      )}
    </div>
  )
}

type MyPlacement = { id: string; companyName: string; jobTitle: string; jobType: string; startDate: string | null; verified: boolean; source: string }

function PlacementCard() {
  const { data } = useQuery<{ myPlacements: MyPlacement[] }>(GET_MY_PLACEMENTS)
  const [report, { loading }] = useMutation(REPORT_MY_PLACEMENT, { refetchQueries: ["GetMyPlacements"] })
  const [remove] = useMutation(DELETE_MY_PLACEMENT, { refetchQueries: ["GetMyPlacements"] })
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ companyName: "", jobTitle: "", jobType: "FULL_TIME", startDate: "" })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const items = data?.myPlacements ?? []

  const submit = async () => {
    try {
      await report({ variables: { input: { ...form, startDate: form.startDate || null } } })
      toast.success("Congratulations! We'll confirm it soon.")
      setOpen(false)
      setForm({ companyName: "", jobTitle: "", jobType: "FULL_TIME", startDate: "" })
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save")
    }
  }

  return (
    <div className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <PartyPopperIcon className="size-4" />
        <h3 className="font-semibold">Got a job?</h3>
      </div>
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id} className="flex items-start gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {p.jobTitle} at {p.companyName}
                </p>
                <p className="text-muted-foreground text-xs">{p.verified ? "Confirmed" : "Waiting for staff to confirm"}</p>
              </div>
              {p.source === "STUDENT" && !p.verified && (
                <button
                  type="button"
                  aria-label="Remove"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => void remove({ variables: { id: p.id } }).catch((e: Error) => toast.error(e.message))}
                >
                  <Trash2Icon className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
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
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2Icon className="size-4 animate-spin" />}
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">Tell us where you were hired. It helps us show new students what our courses lead to.</p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Tell us
          </Button>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ invites */

type Invite = {
  id: string
  companyName: string
  message: string
  createdAt: string
  job: { id: string; title: string; companyName: string; companyLogo: string; status: string; myApplication: { id: string; status: ApplicationStatus } | null } | null
}

function Invites() {
  const { data, loading } = useQuery<{ myJobInvites: Invite[] }>(GET_MY_JOB_INVITES, { fetchPolicy: "cache-and-network" })
  const items = data?.myJobInvites ?? []
  if (loading && !data) return <ContentAreaLoader />
  if (!items.length)
    return (
      <EmptyState title="No invites yet">
        Companies can find you when your portfolio is public and says you&apos;re open to work. They invite students whose skills fit.
      </EmptyState>
    )
  return (
    <div className="space-y-3">
      {items.map((inv) => (
        <div key={inv.id} className="bg-card rounded-xl border p-4">
          <div className="flex flex-wrap items-start gap-4">
            <CompanyLogo src={inv.job?.companyLogo} name={inv.companyName} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{inv.job?.title ?? "Job removed"}</p>
              <p className="text-muted-foreground text-sm">
                {inv.companyName} invited you · {timeAgo(inv.createdAt)}
              </p>
              {inv.message && <p className="bg-muted/50 mt-2 rounded-lg p-3 text-sm whitespace-pre-line">{inv.message}</p>}
            </div>
            {inv.job?.myApplication ? (
              <StatusPill status={inv.job.myApplication.status} />
            ) : inv.job?.status === "OPEN" ? (
              <Button asChild size="sm">
                <Link href={jobPath(inv.job.id)}>See the job and apply</Link>
              </Button>
            ) : (
              <Pill>Closed</Pill>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ interviews */

function Interviews() {
  const { data, loading } = useQuery<{ myInterviews: Interview[] }>(GET_MY_INTERVIEWS, { fetchPolicy: "cache-and-network" })
  const all = data?.myInterviews ?? []
  if (loading && !data) return <ContentAreaLoader />
  if (!all.length) return <EmptyState title="No interviews yet">When a company books an interview with you, it shows here.</EmptyState>
  const upcoming = all.filter((i) => isUpcoming(i) && i.status !== "CANCELLED").sort((a, b) => a.startAt.localeCompare(b.startAt))
  const rest = all.filter((i) => !upcoming.includes(i))
  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Coming up</h2>
          {upcoming.map((iv) => (
            <StudentInterviewCard key={iv.id} iv={iv} />
          ))}
        </section>
      )}
      {rest.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-muted-foreground font-semibold">Earlier and cancelled</h2>
          {rest.map((iv) => (
            <StudentInterviewCard key={iv.id} iv={iv} />
          ))}
        </section>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ practice */

export type PracticeQuestion = {
  question: string
  focus: string
  answer: string
  score: number | null
  feedback: string
  tip: string
  feedbackSource: string
  answeredAt: string | null
}

export type Practice = {
  id: string
  jobId: string
  jobTitle: string
  companyName: string
  source: string
  answeredCount: number
  averageScore: number | null
  aiAvailable: boolean
  feedbackLeftToday: number
  createdAt: string
  updatedAt: string
  questions: PracticeQuestion[]
}

function PracticeList() {
  const { data, loading } = useQuery<{ myInterviewPractices: Practice[] }>(GET_MY_INTERVIEW_PRACTICES, { fetchPolicy: "cache-and-network" })
  const [remove] = useMutation(DELETE_INTERVIEW_PRACTICE, { refetchQueries: ["GetMyInterviewPractices"] })
  const items = data?.myInterviewPractices ?? []
  if (loading && !data) return <ContentAreaLoader />
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Practise answering questions for a real job. Open any job and press <strong>Practise the interview</strong>. You get questions
        based on the job and your projects, and feedback on each answer.
      </p>
      {!items.length ? (
        <EmptyState title="No practice sessions yet">
          <Link href={CONFIG.ROUTES.PUBLIC.JOBS} className="text-(--site-accent)">
            Pick a job to practise for
          </Link>
        </EmptyState>
      ) : (
        items.map((p) => (
          <div key={p.id} className="bg-card flex flex-wrap items-center gap-4 rounded-xl border p-4">
            <div className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-lg">
              <GraduationCapIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <Link href={practicePath(p.id)} className="font-semibold hover:underline">
                {p.jobTitle}
              </Link>
              <p className="text-muted-foreground text-sm">
                {p.companyName} · {p.answeredCount} of {p.questions.length} answered
                {p.averageScore != null && ` · average ${p.averageScore.toFixed(1)} / 5`} · {timeAgo(p.updatedAt)}
              </p>
            </div>
            {p.answeredCount === p.questions.length && <CheckIcon className="size-5 text-emerald-600" aria-label="Done" />}
            <Button asChild size="sm" variant="outline">
              <Link href={practicePath(p.id)}>{p.answeredCount === p.questions.length ? "Review" : "Continue"}</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Delete"
              onClick={() => void remove({ variables: { id: p.id } }).catch((e: Error) => toast.error(e.message))}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))
      )}
    </div>
  )
}
