"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@apollo/client/react"
import { AlertTriangleIcon, Loader2Icon, StarIcon } from "lucide-react"

import { cn } from "@/lib/helpers"
import { filterCoursesForGrader } from "@/lib/helpers/grader-courses"
import { GET_COURSE_FEEDBACK_SUMMARY, GET_COURSE_OPTIONS, GET_FUNNEL_REPORT, GET_INTERVIEW_SKILL_REPORT } from "@/lib/graphql"
import { useUser } from "@/lib/providers/user"
import { Input } from "@/lib/ui/useable-components/input"

const selectClass = "border-input bg-background h-9 rounded-md border px-3 text-sm"

function PageHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-secondary text-sm font-semibold">Staff</div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{description}</p>
      </div>
      {children}
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

function Loading({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-16">
      <Loader2Icon className="size-5 animate-spin" /> {text}
    </div>
  )
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10)
function defaultRange(days: number) {
  const to = new Date()
  const from = new Date(to.getTime() - (days - 1) * 86400000)
  return { from: isoDay(from), to: isoDay(to) }
}

function DateRange({ from, to, onChange }: { from: string; to: string; onChange: (r: { from: string; to: string }) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-2">
        From <Input type="date" value={from} max={to} onChange={(e) => e.target.value && onChange({ from: e.target.value, to })} className="h-9 w-40" />
      </label>
      <label className="flex items-center gap-2">
        to <Input type="date" value={to} min={from} onChange={(e) => e.target.value && onChange({ from, to: e.target.value })} className="h-9 w-40" />
      </label>
      {[30, 90, 365].map((d) => (
        <button key={d} type="button" className="hover:bg-muted rounded-md border px-2 py-1 text-xs" onClick={() => onChange(defaultRange(d))}>
          {d === 365 ? "1 year" : `${d} days`}
        </button>
      ))}
    </div>
  )
}

const fmt = (n: number) => n.toLocaleString("en-US")
const avg = (n: number | null | undefined) => (n == null ? "–" : n.toFixed(1))

/* ================================================================== funnel */

type FunnelReport = {
  from: string
  to: string
  stages: { key: string; label: string; count: number; rateFromPrevious: number | null }[]
  enquiriesThatApplied: number
  lostLeads: number
  rejectedApplications: number
  byCourse: { courseId: string; title: string; applications: number; enrolled: number; graduates: number; hired: number }[]
  daily: { day: string; visits: number; enquiries: number; applications: number }[]
}

function DailyColumns({ daily }: { daily: FunnelReport["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.visits))
  if (!daily.length) return null
  return (
    <div>
      <div className="flex h-28 items-end gap-px" role="img" aria-label="Visits per day">
        {daily.map((d) => (
          <div
            key={d.day}
            title={`${d.day}: ${d.visits} visits, ${d.enquiries} enquiries, ${d.applications} enrolment forms`}
            className={cn("min-w-0 flex-1 rounded-t-sm bg-(--brand-primary)/70 hover:bg-(--brand-primary)", (d.enquiries || d.applications) && "bg-(--brand-primary)")}
            style={{ height: `${Math.max(2, (d.visits / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="text-muted-foreground mt-1 flex justify-between text-xs">
        <span>{daily[0].day}</span>
        <span>{daily[daily.length - 1].day}</span>
      </div>
    </div>
  )
}

export function AdminFunnelScreen() {
  const [range, setRange] = useState(() => defaultRange(90))
  const { data, loading, error } = useQuery<{ funnelReport: FunnelReport }>(GET_FUNNEL_REPORT, {
    variables: range,
    fetchPolicy: "cache-and-network",
  })
  const r = data?.funnelReport
  const top = Math.max(1, ...(r?.stages ?? []).map((s) => s.count))
  const enquiries = r?.stages.find((s) => s.key === "enquiries")?.count ?? 0

  return (
    <div className="w-full space-y-8 py-6">
      <PageHeader
        title="Student funnel"
        description="From a visit to the website, to an enquiry, an enrolment form, enrolment, graduation and a job. Each stage counts what happened in the dates you pick, so later stages can include people who started earlier."
      >
        <DateRange from={range.from} to={range.to} onChange={setRange} />
      </PageHeader>

      {loading && !data ? (
        <Loading text="Adding up…" />
      ) : !r ? (
        <p className="text-destructive">{error?.message ?? "Couldn't load the funnel."}</p>
      ) : (
        <>
          <section className="space-y-2">
            {r.stages.map((s, i) => (
              <div key={s.key} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 sm:grid-cols-[10rem_1fr_9rem]">
                <p className="text-sm font-medium">{s.label}</p>
                <div className="bg-muted h-8 overflow-hidden rounded-md">
                  <div
                    className="flex h-full items-center rounded-md bg-(--brand-primary) px-2 text-xs font-semibold text-white"
                    style={{ width: `${Math.max(2, (s.count / top) * 100)}%`, opacity: 1 - i * 0.1 }}
                  >
                    {s.count / top > 0.08 && fmt(s.count)}
                  </div>
                </div>
                <p className="text-muted-foreground text-right text-xs">
                  {s.count / top <= 0.08 && <span className="text-foreground mr-1 font-semibold">{fmt(s.count)}</span>}
                  {s.rateFromPrevious != null ? `${s.rateFromPrevious}% of previous` : i === 0 ? "" : "–"}
                </p>
              </div>
            ))}
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Enquiries that sent a form"
              value={fmt(r.enquiriesThatApplied)}
              sub={enquiries ? `${Math.round((r.enquiriesThatApplied / enquiries) * 100)}% of enquiries` : undefined}
            />
            <Stat label="Leads marked lost" value={fmt(r.lostLeads)} />
            <Stat label="Enrolment forms turned down" value={fmt(r.rejectedApplications)} />
          </div>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Day by day</h2>
            <p className="text-muted-foreground mb-3 text-sm">Visits per day. Darker days had an enquiry or an enrolment form. Hover for numbers.</p>
            <DailyColumns daily={r.daily} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">By course</h2>
            {!r.byCourse.length ? (
              <p className="text-muted-foreground text-sm">Nothing in these dates.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      <th className="p-3 font-medium">Course</th>
                      <th className="p-3 font-medium">Forms</th>
                      <th className="p-3 font-medium">Enrolled</th>
                      <th className="p-3 font-medium">Graduated</th>
                      <th className="p-3 font-medium">Hired</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.byCourse.map((c) => (
                      <tr key={c.courseId} className="border-b last:border-b-0">
                        <td className="p-3 font-medium">{c.title}</td>
                        <td className="p-3">{fmt(c.applications)}</td>
                        <td className="p-3">
                          {fmt(c.enrolled)}
                          {c.applications > 0 && <span className="text-muted-foreground text-xs"> ({Math.round((c.enrolled / c.applications) * 100)}%)</span>}
                        </td>
                        <td className="p-3">{fmt(c.graduates)}</td>
                        <td className="p-3">{fmt(c.hired)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <p className="text-muted-foreground text-xs">Visits are counted once per browser session, with no cookies or personal data.</p>
        </>
      )}
    </div>
  )
}

/* ================================================================== module ratings */

type ModuleStat = {
  contentId: string
  title: string
  sortOrder: number
  ratings: number
  average: number | null
  distribution: number[]
  needsAttention: boolean
  comments: { rating: number; comment: string; createdAt: string }[]
}
type FeedbackSummary = { courseId: string; courseTitle: string; ratings: number; average: number | null; modules: ModuleStat[] }

function useStaffCourses() {
  const { userProfileInfo } = useUser()
  const { data } = useQuery<{ getCourses: { id: string; title: string; slug: string }[] }>(GET_COURSE_OPTIONS)
  return useMemo(
    () => filterCoursesForGrader(data?.getCourses ?? [], userProfileInfo?.role, userProfileInfo?.allowedMarkGradesOn),
    [data, userProfileInfo?.role, userProfileInfo?.allowedMarkGradesOn]
  )
}

function Stars({ value }: { value: number | null }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={value == null ? "No ratings" : `${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={cn("size-4", value != null && n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
      ))}
    </span>
  )
}

function ModuleCard({ m }: { m: ModuleStat }) {
  const [open, setOpen] = useState(m.needsAttention)
  const most = Math.max(1, ...m.distribution)
  return (
    <div className={cn("bg-card rounded-xl border p-4", m.needsAttention && "border-rose-500/50")}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 font-medium">{m.title}</p>
        {m.needsAttention && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
            <AlertTriangleIcon className="size-3.5" /> Needs a look
          </span>
        )}
        <Stars value={m.average} />
        <span className="text-muted-foreground text-sm">
          {avg(m.average)} · {m.ratings} rating{m.ratings === 1 ? "" : "s"}
        </span>
      </div>
      {m.ratings > 0 && (
        <div className="mt-3 grid max-w-sm gap-1">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-3">{star}</span>
              <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                <div
                  className={cn("h-full rounded-full", star <= 2 ? "bg-rose-500" : star === 3 ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${(m.distribution[star - 1] / most) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground w-6 text-right">{m.distribution[star - 1]}</span>
            </div>
          ))}
        </div>
      )}
      {m.comments.length > 0 && (
        <div className="mt-3">
          <button type="button" className="text-sm font-medium text-(--brand-secondary)" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? "Hide comments" : `${m.comments.length} comment${m.comments.length === 1 ? "" : "s"}`}
          </button>
          {open && (
            <ul className="mt-2 space-y-2">
              {m.comments.map((c, i) => (
                <li key={i} className="bg-muted/40 rounded-lg p-2 text-sm">
                  <span className="text-muted-foreground mr-2 text-xs">{c.rating}★</span>
                  {c.comment}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminCourseFeedbackScreen() {
  const courses = useStaffCourses()
  const [picked, setPicked] = useState("")
  const courseId = picked || courses[0]?.id || ""
  const [sort, setSort] = useState<"order" | "lowest">("order")
  const { data, loading, error } = useQuery<{ courseFeedbackSummary: FeedbackSummary }>(GET_COURSE_FEEDBACK_SUMMARY, {
    variables: { courseId },
    skip: !courseId,
    fetchPolicy: "cache-and-network",
  })
  const s = data?.courseFeedbackSummary?.courseId === courseId ? data.courseFeedbackSummary : null
  const modules = [...(s?.modules ?? [])].sort((a, b) =>
    sort === "order" ? a.sortOrder - b.sortOrder : (a.average ?? 6) - (b.average ?? 6)
  )
  const flagged = modules.filter((m) => m.needsAttention).length

  return (
    <div className="w-full space-y-6 py-6">
      <PageHeader
        title="Module ratings"
        description="Students rate each module of their course from 1 to 5, with an optional comment. Comments are shown without names. A module needs a look when at least 3 students rated it and the average is 3 or below."
      >
        <div className="flex flex-wrap gap-2">
          <select aria-label="Course" className={selectClass} value={courseId} onChange={(e) => setPicked(e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <select aria-label="Sort" className={selectClass} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="order">Course order</option>
            <option value="lowest">Lowest rated first</option>
          </select>
        </div>
      </PageHeader>

      {!courses.length ? (
        <p className="text-muted-foreground text-sm">You don&apos;t have any courses yet.</p>
      ) : loading && !s ? (
        <Loading text="Loading ratings…" />
      ) : !s ? (
        <p className="text-destructive">{error?.message ?? "Couldn't load the ratings."}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Average rating" value={avg(s.average)} sub="out of 5" />
            <Stat label="Ratings" value={fmt(s.ratings)} />
            <Stat label="Modules that need a look" value={String(flagged)} />
          </div>
          {!modules.length ? (
            <p className="text-muted-foreground text-sm">This course has no published modules yet.</p>
          ) : (
            <div className="space-y-3">
              {modules.map((m) => (
                <ModuleCard key={m.contentId} m={m} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ================================================================== interview skills */

type SkillStat = { skill: string; average: number; count: number; lowCount: number }
type SkillReport = {
  feedbackCount: number
  averageOverall: number | null
  recommendations: { strongYes: number; yes: number; no: number; strongNo: number }
  skills: SkillStat[]
  byCourse: { courseId: string; title: string; feedbackCount: number; averageOverall: number | null; weakSkills: SkillStat[] }[]
}

function SkillBar({ s }: { s: SkillStat }) {
  return (
    <div className="grid grid-cols-[minmax(6rem,10rem)_1fr_auto] items-center gap-3 text-sm">
      <span className="truncate font-medium">{s.skill}</span>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", s.average < 2.5 ? "bg-rose-500" : s.average < 3.5 ? "bg-amber-500" : "bg-emerald-500")}
          style={{ width: `${(s.average / 5) * 100}%` }}
        />
      </div>
      <span className="text-muted-foreground w-36 text-right text-xs">
        {s.average.toFixed(1)}/5 · {s.count} scored{s.lowCount ? ` · ${s.lowCount} low` : ""}
      </span>
    </div>
  )
}

export function AdminInterviewSkillsScreen() {
  const [range, setRange] = useState(() => defaultRange(180))
  const { data, loading, error } = useQuery<{ interviewSkillReport: SkillReport }>(GET_INTERVIEW_SKILL_REPORT, {
    variables: range,
    fetchPolicy: "cache-and-network",
  })
  const r = data?.interviewSkillReport
  const rec = r?.recommendations
  const yes = rec ? rec.strongYes + rec.yes : 0
  const total = rec ? yes + rec.no + rec.strongNo : 0

  return (
    <div className="w-full space-y-8 py-6">
      <PageHeader
        title="Interview skills"
        description="What companies scored our students on in interviews, without names. Low scores show which skills to teach more. Instructors see their own courses."
      >
        <DateRange from={range.from} to={range.to} onChange={setRange} />
      </PageHeader>

      {loading && !data ? (
        <Loading text="Adding up scorecards…" />
      ) : !r ? (
        <p className="text-destructive">{error?.message ?? "Couldn't load the report."}</p>
      ) : !r.feedbackCount ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No scorecards in these dates.</p>
          <p className="text-muted-foreground mt-1 text-sm">Companies fill them in after interviews they book through the portal.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Scorecards" value={fmt(r.feedbackCount)} />
            <Stat label="Average overall" value={avg(r.averageOverall)} sub="out of 5" />
            <Stat label="Would hire" value={total ? `${Math.round((yes / total) * 100)}%` : "–"} sub={`${rec?.strongYes ?? 0} strong yes · ${rec?.yes ?? 0} yes`} />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Skills, weakest first</h2>
            {!r.skills.length ? (
              <p className="text-muted-foreground text-sm">Companies haven&apos;t scored individual skills yet.</p>
            ) : (
              <div className="bg-card space-y-2 rounded-xl border p-4">
                {r.skills.map((s) => (
                  <SkillBar key={s.skill} s={s} />
                ))}
              </div>
            )}
          </section>

          {r.byCourse.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">By course</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {r.byCourse.map((c) => (
                  <div key={c.courseId} className="bg-card rounded-xl border p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium">{c.title}</p>
                      <p className="text-muted-foreground text-sm">
                        {c.feedbackCount} scorecard{c.feedbackCount === 1 ? "" : "s"} · {avg(c.averageOverall)} overall
                      </p>
                    </div>
                    {c.weakSkills.length ? (
                      <div className="mt-3 space-y-2">
                        {c.weakSkills.map((s) => (
                          <SkillBar key={s.skill} s={s} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-2 text-sm">No skills scored.</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
