"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  ArrowLeftIcon,
  AwardIcon,
  BriefcaseIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FacebookIcon,
  FileTextIcon,
  GithubIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedinIcon,
  Loader2Icon,
  MapPinIcon,
  SearchIcon,
  TwitterIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import { getImageSrc } from "@/lib/helpers/image"
import { APPLY_TO_JOB, GET_COMPANY_BY_SLUG, GET_JOB, GET_JOBS, GET_PARTNER_COMPANIES, GET_PORTFOLIO } from "@/lib/graphql"
import { useUser } from "@/lib/providers/user"
import { apiService } from "@/lib/services/api"
import { ContinueToDashboardDialog } from "@/lib/ui/useable-components/continue-dashboard-dialog"
import { Input } from "@/lib/ui/useable-components/input"
import { PageIntro, SectionLabel, siteButton, siteContainer } from "@/lib/ui/useable-components/site-chrome/ui"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { CONFIG } from "@/utils/constants"
import { UserRole } from "@/utils/enums/user"
import { CoverNoteButton, JobFitBox, PractiseButton } from "../careers/job-fit"
import { PlacementStatsBand } from "../careers/public-stats"
import { TailorForExternalJob, TailoredCvChoice } from "../resume/apply"
import {
  COMPANY_SIZES,
  CompanyLogo,
  EmptyState,
  Field,
  JOB_TYPE_LABEL,
  JobCard,
  PartnerBadge,
  Pill,
  StatusPill,
  WORK_MODE_LABEL,
  companyPath,
  formatSalary,
  jobPath,
  portfolioPath,
  selectClass,
  timeAgo,
  type Company,
  type Job,
  type JobType,
  type WorkMode,
} from "./shared"

const PAGE_SIZE = 20

/* ------------------------------------------------------------------ partners strip */

function PartnerCompanies() {
  const { data } = useQuery<{ partnerCompanies: Company[] }>(GET_PARTNER_COMPANIES)
  const list = data?.partnerCompanies ?? []
  if (!list.length) return null
  return (
    <section className="border-b py-8">
      <div className={siteContainer}>
        <SectionLabel>{"// hiring partners"}</SectionLabel>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {list.map((c) => (
            <Link
              key={c.id}
              href={companyPath(c.slug)}
              className="bg-card hover:border-foreground/20 flex min-w-56 items-center gap-3 rounded-xl border p-3 transition-colors"
            >
              <CompanyLogo src={c.logo} name={c.name} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="text-muted-foreground text-xs">
                  {c.openJobsCount} open job{c.openJobsCount === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ board */

export function JobsBoardScreen() {
  const [search, setSearch] = useState("")
  const [applied, setApplied] = useState("")
  const [jobType, setJobType] = useState<JobType | "">("")
  const [workMode, setWorkMode] = useState<WorkMode | "">("")
  const [partnerOnly, setPartnerOnly] = useState(false)
  const [portalOnly, setPortalOnly] = useState(false)
  const [page, setPage] = useState(1)
  const { data, loading } = useQuery<{ jobs: { items: Job[]; total: number } }>(GET_JOBS, {
    variables: {
      filter: { search: applied || null, jobType: jobType || null, workMode: workMode || null, partnerOnly, portalOnly },
      page,
      limit: PAGE_SIZE,
    },
  })
  const jobs = data?.jobs.items ?? []
  const total = data?.jobs.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPage(1)
  }

  return (
    <div className="w-full">
      <PageIntro
        label="// job hunt corner"
        title="Jobs for TechOn Skills students."
        description="Openings from software houses we work with, companies hiring on the portal, and remote jobs from public job boards — in one place. Apply with your portfolio in one click."
      >
        <Link href={CONFIG.ROUTES.PUBLIC.HIRE} className={siteButton.outline}>
          Hiring? Post a job
        </Link>
      </PageIntro>
      <PartnerCompanies />
      <section className="py-10">
        <div className={cn(siteContainer, "space-y-5")}>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              setApplied(search.trim())
              setPage(1)
            }}
          >
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, skill, company or city" className="pl-9" />
            </div>
            <button type="submit" className={siteButton.primary}>
              Search
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Job type" className={`${selectClass} w-auto`} value={jobType} onChange={(e) => reset(setJobType)(e.target.value as JobType | "")}>
              <option value="">All types</option>
              {Object.entries(JOB_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select aria-label="Work mode" className={`${selectClass} w-auto`} value={workMode} onChange={(e) => reset(setWorkMode)(e.target.value as WorkMode | "")}>
              <option value="">On-site, remote or hybrid</option>
              {Object.entries(WORK_MODE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={partnerOnly} onChange={(e) => reset(setPartnerOnly)(e.target.checked)} /> Partners only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={portalOnly} onChange={(e) => reset(setPortalOnly)(e.target.checked)} /> Posted on TechOn Skills
            </label>
            <span className="text-muted-foreground ml-auto text-sm">
              {total} job{total === 1 ? "" : "s"}
            </span>
          </div>
          {loading && !data ? (
            <div className="flex justify-center py-16">
              <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : !jobs.length ? (
            <EmptyState title="No jobs match">Try other filters, or check back soon.</EmptyState>
          ) : (
            <div className="space-y-3">
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} href={jobPath(j.id)} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button type="button" className={siteButton.outline} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {pages}
              </span>
              <button type="button" className={siteButton.outline} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ job page */

function ApplyBox({ job }: { job: Job }) {
  const { userProfileInfo, profileLoaded } = useUser()
  const [note, setNote] = useState("")
  const [apply, { loading, data }] = useMutation<{ applyToJob: { id: string; status: "SUBMITTED" } }>(APPLY_TO_JOB, {
    refetchQueries: [{ query: GET_JOB, variables: { id: job.id } }],
  })
  const role = userProfileInfo?.role

  if (job.status === "CLOSED") return <p className="text-muted-foreground text-sm">This job is closed.</p>

  if (job.applyMode === "EXTERNAL") {
    return (
      <div className="space-y-2">
        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className={cn(siteButton.primary, "w-full")}>
          Apply on {job.feedSource ? job.feedSource : "the company's site"} <ExternalLinkIcon className="size-4" />
        </a>
        <p className="text-muted-foreground text-xs">You&apos;ll apply on another website. Add your portfolio link to your application there.</p>
        {role === UserRole.STUDENT && <TailorForExternalJob jobId={job.id} buttonClass={siteButton.outline} />}
        {role === UserRole.STUDENT && !job.fit && <PractiseButton jobId={job.id} />}
      </div>
    )
  }

  if (!profileLoaded) return <Loader2Icon className="text-muted-foreground size-5 animate-spin" />

  if (!userProfileInfo) {
    return (
      <div className="space-y-2 text-sm">
        <p>Students apply here with their TechOn Skills portfolio.</p>
        <ContinueToDashboardDialog plain className={cn(siteButton.primary, "w-full")} />
      </div>
    )
  }
  if (role !== UserRole.STUDENT) return <p className="text-muted-foreground text-sm">Only student accounts can apply for jobs.</p>

  const mine = data?.applyToJob ?? job.myApplication
  if (mine) {
    return (
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2Icon className="size-4 text-emerald-600" /> You applied
        </p>
        <StatusPill status={mine.status} />
        <p>
          <Link href={CONFIG.ROUTES.STUDENT.JOBS} className="text-(--site-accent)">
            See your applications
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Field label="Note to the company" hint="Optional. Why you'd be a good fit.">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} maxLength={2000} />
      </Field>
      <CoverNoteButton jobId={job.id} hasText={!!note.trim()} onDraft={setNote} />
      <TailoredCvChoice
        jobId={job.id}
        sending={loading}
        buttonClass={siteButton.primary}
        onApply={async (resumeId) => {
          try {
            await apply({ variables: { jobId: job.id, coverNote: note.trim() || null, resumeId } })
            toast.success(resumeId ? "Application sent with your CV for this job." : "Application sent. The company gets your portfolio by email.")
          } catch (err) {
            toast.error((err as Error).message || "Couldn't apply")
          }
        }}
      />
      <p className="text-muted-foreground text-xs">
        Your <Link href={CONFIG.ROUTES.STUDENT.PORTFOLIO} className="underline">portfolio</Link> link always goes with your application.
      </p>
    </div>
  )
}

export function JobDetailScreen({ id }: { id: string }) {
  const { data, loading } = useQuery<{ job: Job | null }>(GET_JOB, { variables: { id } })
  const job = data?.job
  if (loading && !data)
    return (
      <div className="flex justify-center py-24">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  if (!job)
    return (
      <div className={cn(siteContainer, "py-20")}>
        <EmptyState title="This job isn't available">
          <Link href={CONFIG.ROUTES.PUBLIC.JOBS} className="text-(--site-accent)">
            See all jobs
          </Link>
        </EmptyState>
      </div>
    )
  const salary = formatSalary(job)
  return (
    <div className={cn(siteContainer, "py-10")}>
      <Link href={CONFIG.ROUTES.PUBLIC.JOBS} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
        <ArrowLeftIcon className="size-4" /> All jobs
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <article className="min-w-0">
          <div className="flex items-start gap-4">
            <CompanyLogo src={job.company?.logo || job.companyLogo} name={job.companyName} className="size-14" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{job.title}</h1>
              <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                {job.company ? (
                  <Link href={companyPath(job.company.slug)} className="hover:text-foreground font-medium">
                    {job.companyName}
                  </Link>
                ) : (
                  job.companyName
                )}
                {job.fromPartner && <PartnerBadge />}
              </p>
              {job.referrer && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Shared by{" "}
                  {job.referrer.portfolioSlug ? (
                    <Link href={portfolioPath(job.referrer.portfolioSlug)} className="hover:text-foreground font-medium">
                      {job.referrer.fullName}
                    </Link>
                  ) : (
                    job.referrer.fullName
                  )}
                  , a TechOn Skills graduate
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Pill>{JOB_TYPE_LABEL[job.jobType]}</Pill>
            <Pill>{WORK_MODE_LABEL[job.workMode]}</Pill>
            {job.location && (
              <Pill className="inline-flex items-center gap-1">
                <MapPinIcon className="size-3" /> {job.location}
              </Pill>
            )}
            {job.experience && <Pill>{job.experience}</Pill>}
            {salary && <Pill>{salary}</Pill>}
          </div>
          {job.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <span key={s} className="rounded-md border px-2 py-0.5 font-mono text-xs">
                  {s}
                </span>
              ))}
            </div>
          )}
          <div className="mt-8 text-[15px] leading-relaxed whitespace-pre-line">{job.description || "No description given."}</div>
          {job.feedSource && (
            <p className="text-muted-foreground mt-8 text-xs">
              Listed via {job.feedSource}. Check the details on the original posting before applying.
            </p>
          )}
        </article>
        <aside className="h-fit space-y-4 rounded-xl border p-5 lg:sticky lg:top-24">
          <ApplyBox job={job} />
          {job.fit && (
            <div className="border-t pt-4">
              <JobFitBox fit={job.fit} jobId={job.id} canPractise />
            </div>
          )}
          <div className="text-muted-foreground space-y-1 border-t pt-4 text-xs">
            <p>Posted {timeAgo(job.postedAt)}</p>
            {job.deadline && <p>Apply by {job.deadline}</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ company page */

function SocialLinks({ items }: { items: { href: string; label: string; icon: typeof GlobeIcon }[] }) {
  const shown = items.filter((i) => i.href)
  if (!shown.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((i) => (
        <a
          key={i.label}
          href={i.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
        >
          <i.icon className="size-4" /> {i.label}
        </a>
      ))}
    </div>
  )
}

export function CompanyPageScreen({ slug }: { slug: string }) {
  const { data, loading } = useQuery<{ companyBySlug: Company | null }>(GET_COMPANY_BY_SLUG, { variables: { slug } })
  const { data: jobsData } = useQuery<{ jobs: { items: Job[]; total: number } }>(GET_JOBS, {
    variables: { filter: { companySlug: slug }, limit: 50 },
  })
  const c = data?.companyBySlug
  if (loading && !data)
    return (
      <div className="flex justify-center py-24">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  if (!c)
    return (
      <div className={cn(siteContainer, "py-20")}>
        <EmptyState title="Company not found" />
      </div>
    )
  const jobs = jobsData?.jobs.items ?? []
  return (
    <div className={cn(siteContainer, "py-10")}>
      <div className="flex flex-wrap items-start gap-5">
        <CompanyLogo src={c.logo} name={c.name} className="size-20" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{c.name}</h1>
            {c.isPartner && <PartnerBadge />}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{[c.industry, c.city, c.size && `${c.size} people`].filter(Boolean).join(" · ")}</p>
          <div className="mt-4">
            <SocialLinks
              items={[
                { href: c.website, label: "Website", icon: GlobeIcon },
                { href: c.linkedin, label: "LinkedIn", icon: LinkedinIcon },
                { href: c.facebook, label: "Facebook", icon: FacebookIcon },
                { href: c.instagram, label: "Instagram", icon: InstagramIcon },
                { href: c.twitter, label: "X", icon: TwitterIcon },
              ]}
            />
          </div>
        </div>
      </div>
      {c.about && <p className="mt-8 max-w-3xl text-[15px] leading-relaxed whitespace-pre-line">{c.about}</p>}
      <h2 className="mt-10 mb-4 flex items-center gap-2 text-xl font-semibold">
        <BriefcaseIcon className="size-5" /> Open jobs ({jobs.length})
      </h2>
      {jobs.length ? (
        <div className="space-y-3">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} href={jobPath(j.id)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No open jobs right now" />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ portfolio page */

type Portfolio = {
  slug: string
  url: string
  fullName: string
  profilePicture: string
  headline: string
  bio: string
  location: string
  skills: string[]
  github: string
  linkedin: string
  website: string
  links: { label: string; url: string }[]
  projects: { title: string; description: string; url: string; repoUrl: string; image: string; tech: string[] }[]
  experience: { role: string; company: string; start: string; end: string; description: string }[]
  education: { school: string; degree: string; start: string; end: string }[]
  cvUrl: string
  openToWork: boolean
  isPublic: boolean
  showMarks: boolean
  certificates: { courseName: string; grade: string; percentage: number; verificationCode: string; issuedAt: string | null }[]
  courses: string[]
  averageMark: number | null
}
export type { Portfolio }

const span = (a: string, b: string) => [a, b].filter(Boolean).join(" – ")

export function PortfolioView({ p }: { p: Portfolio }) {
  const avatar = getImageSrc(p.profilePicture)
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center gap-5">
        <div className="bg-muted size-24 shrink-0 overflow-hidden rounded-full border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar && <img src={avatar} alt={p.fullName} className="size-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{p.fullName}</h1>
            {p.openToWork && <Pill className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Open to work</Pill>}
          </div>
          {p.headline && <p className="mt-1 text-lg">{p.headline}</p>}
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
            {p.location && (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="size-4" /> {p.location}
              </span>
            )}
            <span>TechOn Skills student</span>
          </p>
          <div className="mt-4">
            <SocialLinks
              items={[
                { href: p.github, label: "GitHub", icon: GithubIcon },
                { href: p.linkedin, label: "LinkedIn", icon: LinkedinIcon },
                { href: p.website, label: "Website", icon: GlobeIcon },
                { href: p.cvUrl, label: "CV", icon: FileTextIcon },
                ...p.links.map((l) => ({ href: l.url, label: l.label || "Link", icon: ExternalLinkIcon })),
              ]}
            />
          </div>
        </div>
      </header>

      {p.bio && <p className="max-w-3xl text-[15px] leading-relaxed whitespace-pre-line">{p.bio}</p>}

      {p.skills.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {p.skills.map((s) => (
              <span key={s} className="rounded-md border px-2 py-1 font-mono text-xs">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {p.projects.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Projects</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {p.projects.map((x, i) => (
              <div key={i} id={`project-${i + 1}`} className="bg-card scroll-mt-24 overflow-hidden rounded-xl border target:ring-2 target:ring-(--site-accent)">
                {x.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={x.image} alt="" className="aspect-video w-full object-cover" />
                )}
                <div className="space-y-2 p-4">
                  <p className="font-semibold">{x.title}</p>
                  {x.description && <p className="text-muted-foreground text-sm whitespace-pre-line">{x.description}</p>}
                  {x.tech.length > 0 && <p className="font-mono text-xs">{x.tech.join(" · ")}</p>}
                  <div className="flex gap-3 text-sm">
                    {x.url && (
                      <a href={x.url} target="_blank" rel="noopener noreferrer nofollow" className="text-(--site-accent)">
                        Live
                      </a>
                    )}
                    {x.repoUrl && (
                      <a href={x.repoUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-(--site-accent)">
                        Code
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(p.certificates.length > 0 || p.courses.length > 0 || p.averageMark != null) && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <AwardIcon className="size-5" /> At TechOn Skills
          </h2>
          <div className="space-y-3">
            {p.certificates.map((c) => (
              <div key={c.verificationCode} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                <div>
                  <p className="font-medium">{c.courseName}</p>
                  <p className="text-muted-foreground text-xs">
                    Grade {c.grade} · {c.percentage}%
                  </p>
                </div>
                <Link href={`${CONFIG.ROUTES.PUBLIC.CERTIFICATE_VERIFY}/${encodeURIComponent(c.verificationCode)}`} className="text-(--site-accent)">
                  Verify certificate
                </Link>
              </div>
            ))}
            {p.courses.length > 0 && <p className="text-sm">Courses: {p.courses.join(", ")}</p>}
            {p.averageMark != null && <p className="text-sm">Average mark on assignments and quizzes: {p.averageMark}%</p>}
          </div>
        </section>
      )}

      {p.experience.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Experience</h2>
          <div className="space-y-4">
            {p.experience.map((x, i) => (
              <div key={i}>
                <p className="font-medium">
                  {x.role} · {x.company}
                </p>
                <p className="text-muted-foreground text-xs">{span(x.start, x.end)}</p>
                {x.description && <p className="mt-1 text-sm whitespace-pre-line">{x.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {p.education.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Education</h2>
          <div className="space-y-3">
            {p.education.map((x, i) => (
              <div key={i}>
                <p className="font-medium">{x.school}</p>
                <p className="text-muted-foreground text-sm">{[x.degree, span(x.start, x.end)].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function PortfolioPageScreen({ slug }: { slug: string }) {
  const { data, loading } = useQuery<{ portfolio: Portfolio | null }>(GET_PORTFOLIO, { variables: { slug } })
  if (loading && !data)
    return (
      <div className="flex justify-center py-24">
        <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  if (!data?.portfolio)
    return (
      <div className={cn(siteContainer, "py-20")}>
        <EmptyState title="Portfolio not found">It may be private, or the link is wrong.</EmptyState>
      </div>
    )
  return (
    <div className={cn(siteContainer, "max-w-4xl! py-12")}>
      <PortfolioView p={data.portfolio} />
    </div>
  )
}

/* ------------------------------------------------------------------ hire (company sign-up) */

const emptyHire = {
  companyName: "",
  website: "",
  industry: "",
  size: "",
  city: "",
  about: "",
  fullName: "",
  email: "",
  phone: "",
  linkedin: "",
}

export function HireScreen() {
  const [form, setForm] = useState(emptyHire)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState("")
  const set = (k: keyof typeof emptyHire) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="w-full">
      <PageIntro
        label="// hire from techon skills"
        title="Hire students who've built real projects."
        description="Post jobs and internships for free. Students apply with a portfolio of their projects, marks and verified certificates, and you get every application by email."
      />
      <PlacementStatsBand />
      <section className="py-12">
        <div className={cn(siteContainer, "max-w-3xl!")}>
          {done ? (
            <div className="rounded-xl border p-8 text-center">
              <CheckCircle2Icon className="mx-auto size-10 text-emerald-600" />
              <p className="mt-3 text-lg font-semibold">Thanks!</p>
              <p className="text-muted-foreground mt-1">{done}</p>
            </div>
          ) : (
            <form
              className="space-y-5 rounded-xl border p-6"
              onSubmit={async (e) => {
                e.preventDefault()
                setSending(true)
                try {
                  const res = await apiService.registerCompany(form)
                  if (res.success) setDone(res.message || "We'll review your company and email you.")
                  else toast.error(res.message || "Couldn't send. Please try again.")
                } catch {
                  toast.error("Couldn't send. Please try again.")
                } finally {
                  setSending(false)
                }
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company name">
                  <Input value={form.companyName} onChange={set("companyName")} required maxLength={120} />
                </Field>
                <Field label="Website">
                  <Input value={form.website} onChange={set("website")} placeholder="https://" />
                </Field>
                <Field label="Industry">
                  <Input value={form.industry} onChange={set("industry")} placeholder="Software house" />
                </Field>
                <Field label="City">
                  <Input value={form.city} onChange={set("city")} placeholder="Lahore" />
                </Field>
                <Field label="Team size">
                  <select value={form.size} onChange={set("size")} className={selectClass}>
                    <option value="">Choose</option>
                    {COMPANY_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s} people
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="LinkedIn page">
                  <Input value={form.linkedin} onChange={set("linkedin")} placeholder="https://www.linkedin.com/company/…" />
                </Field>
              </div>
              <Field label="About the company">
                <Textarea value={form.about} onChange={set("about")} rows={4} maxLength={3000} />
              </Field>
              <div className="grid gap-4 border-t pt-5 sm:grid-cols-3">
                <Field label="Your name">
                  <Input value={form.fullName} onChange={set("fullName")} required maxLength={120} />
                </Field>
                <Field label="Work email" hint="You'll sign in with this.">
                  <Input type="email" value={form.email} onChange={set("email")} required />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={set("phone")} />
                </Field>
              </div>
              <p className="text-muted-foreground text-xs">
                We review every company before it can post. Once approved, sign in with your email and manage jobs and applicants from
                your employer dashboard.
              </p>
              <button type="submit" className={siteButton.primary} disabled={sending}>
                {sending && <Loader2Icon className="size-4 animate-spin" />} Send sign-up
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
