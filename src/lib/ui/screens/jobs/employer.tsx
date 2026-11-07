"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  BookmarkIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  LogOutIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import {
  CREATE_JOB,
  GET_JOB_APPLICATIONS,
  GET_MY_COMPANY,
  GET_MY_COMPANY_JOBS,
  SET_JOB_STATUS,
  SYNC_COMPANY_JOBS,
  UPDATE_JOB,
  UPDATE_MY_COMPANY,
} from "@/lib/graphql"
import { useUser } from "@/lib/providers/user"
import { apiService } from "@/lib/services/api"
import { Button } from "@/lib/ui/useable-components/button"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { ThemeSwitcher } from "@/lib/ui/useable-components/theme-switcher"
import { CONFIG } from "@/utils/constants"
import { InterviewDialog } from "../careers/interview"
import { ApplicationsList } from "./applications"
import { BrandMark } from "@/lib/ui/useable-components/brand-logo"
import {
  CAREERS_PROVIDER_LABEL,
  CompanyForm,
  EmptyState,
  JobCard,
  JobForm,
  companyFormFrom,
  companyPath,
  jobFormFrom,
  jobInputFrom,
  jobPath,
  selectClass,
  timeAgo,
  type Application,
  type Company,
  type CompanyFormValues,
  type Job,
} from "./shared"

const ROUTES = CONFIG.ROUTES.EMPLOYER

const TABS = [
  { label: "Overview", href: ROUTES.DASHBOARD, icon: LayoutDashboardIcon },
  { label: "Jobs", href: ROUTES.JOBS, icon: BriefcaseIcon },
  { label: "Pipeline", href: ROUTES.PIPELINE, icon: KanbanIcon },
  { label: "Applicants", href: ROUTES.APPLICATIONS, icon: UsersIcon },
  { label: "Find talent", href: ROUTES.CANDIDATES, icon: SearchIcon },
  { label: "Shortlist", href: ROUTES.SHORTLIST, icon: BookmarkIcon },
  { label: "Interviews", href: ROUTES.INTERVIEWS, icon: CalendarDaysIcon },
  { label: "Projects", href: ROUTES.PROJECTS, icon: LightbulbIcon },
  { label: "Company profile", href: ROUTES.COMPANY, icon: Building2Icon },
]

export function EmployerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { userProfileInfo } = useUser()

  const logout = async () => {
    try {
      await apiService.logout()
    } finally {
      Object.values(CONFIG.STORAGE_KEYS.AUTH).forEach((key) => localStorage.removeItem(key))
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER.PROFILE)
      router.replace(CONFIG.ROUTES.PUBLIC.HOME)
    }
  }

  return (
    <div className="bg-surface flex min-h-svh flex-col">
      <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href={CONFIG.ROUTES.PUBLIC.HOME} aria-label="TechOn Skills home" className="shrink-0">
            <BrandMark className="size-10" title="TechOn Skills" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Employer dashboard</p>
            <p className="text-muted-foreground truncate text-xs">{userProfileInfo?.email}</p>
          </div>
          <ThemeSwitcher />
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            <LogOutIcon className="size-4" /> Sign out
          </Button>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Employer">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`)
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm",
                  active ? "border-(--site-accent) font-medium" : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                <t.icon className="size-4" /> {t.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}

export function useMyCompany() {
  const { data, loading, error } = useQuery<{ myCompany: Company }>(GET_MY_COMPANY, { fetchPolicy: "cache-and-network" })
  return { company: data?.myCompany ?? null, loading: loading && !data, error }
}

export function PendingNotice({ company }: { company: Company }) {
  if (company.status === "APPROVED") return null
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-sm",
        company.status === "REJECTED" ? "border-rose-500/40 bg-rose-500/5" : "border-amber-500/40 bg-amber-500/5"
      )}
    >
      {company.status === "REJECTED" ? (
        <>
          <p className="font-medium">Your company sign-up wasn&apos;t approved.</p>
          {company.reviewNote && <p className="mt-1">{company.reviewNote}</p>}
          <p className="text-muted-foreground mt-1">Reply to our email or contact us if you think this is a mistake.</p>
        </>
      ) : (
        <>
          <p className="font-medium">We&apos;re reviewing your company.</p>
          <p className="text-muted-foreground mt-1">
            You can fill in your company profile now. You can post jobs once we approve it, and we&apos;ll email you when we do.
          </p>
        </>
      )}
    </div>
  )
}

export function EmployerDashboardScreen() {
  const { company, loading } = useMyCompany()
  const { data } = useQuery<{ myCompanyJobs: Job[] }>(GET_MY_COMPANY_JOBS, { skip: company?.status !== "APPROVED" })
  if (loading) return <ContentAreaLoader />
  if (!company) return <EmptyState title="Your account isn't linked to a company">Contact us to fix this.</EmptyState>
  const jobs = data?.myCompanyJobs ?? []
  const open = jobs.filter((j) => j.status === "OPEN")
  const applicants = jobs.reduce((s, j) => s + (j.applicationsCount ?? 0), 0)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
        {company.status === "APPROVED" && (
          <Link href={companyPath(company.slug)} className="text-sm text-(--site-accent)" target="_blank">
            View your public company page
          </Link>
        )}
      </div>
      <PendingNotice company={company} />
      {company.status === "APPROVED" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Open jobs", value: open.length },
              { label: "All jobs", value: jobs.length },
              { label: "Applicants", value: applicants },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl border p-4">
                <p className="text-muted-foreground text-sm">{s.label}</p>
                <p className="mt-1 text-3xl font-semibold">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`${ROUTES.JOBS}?new=1`}>
                <PlusIcon className="size-4" /> Post a job
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.APPLICATIONS}>See applicants</Link>
            </Button>
          </div>
          {company.careersProvider && (
            <p className="text-muted-foreground text-sm">
              Jobs are imported from your {CAREERS_PROVIDER_LABEL[company.careersProvider]} careers page.{" "}
              {company.careersSyncResult && <>Last import: {company.careersSyncResult}</>}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export function EmployerCompanyScreen() {
  const { company, loading } = useMyCompany()
  const [save, { loading: saving }] = useMutation(UPDATE_MY_COMPANY)
  if (loading) return <ContentAreaLoader />
  if (!company) return <EmptyState title="Your account isn't linked to a company" />
  const submit = async (v: CompanyFormValues) => {
    try {
      await save({ variables: { input: v } })
      toast.success("Company profile saved")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save")
    }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Company profile</h1>
      <PendingNotice company={company} />
      <div className="bg-card rounded-xl border p-5">
        <CompanyForm key={company.id} initial={companyFormFrom(company)} saving={saving} onSubmit={(v) => void submit(v)} />
      </div>
      {company.careersProvider && <CareersSyncCard company={company} />}
    </div>
  )
}

function CareersSyncCard({ company, companyId }: { company: Company; companyId?: string }) {
  const [sync, { loading }] = useMutation(SYNC_COMPANY_JOBS)
  return (
    <div className="bg-card flex flex-wrap items-center gap-3 rounded-xl border p-4 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{CAREERS_PROVIDER_LABEL[company.careersProvider]} careers page connected</p>
        <p className="text-muted-foreground">
          {company.careersSyncResult || "Not imported yet"}
          {company.careersSyncedAt && ` · ${timeAgo(company.careersSyncedAt)}`}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={async () => {
          try {
            await sync({ variables: { companyId: companyId ?? null } })
            toast.success("Jobs imported")
          } catch (e) {
            toast.error((e as Error).message || "Couldn't import")
          }
        }}
      >
        <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} /> Import now
      </Button>
    </div>
  )
}
export { CareersSyncCard }

export function EmployerJobsScreen({ startNew = false }: { startNew?: boolean }) {
  const { company, loading } = useMyCompany()
  const { data, loading: jobsLoading, refetch } = useQuery<{ myCompanyJobs: Job[] }>(GET_MY_COMPANY_JOBS, {
    skip: company?.status !== "APPROVED",
    fetchPolicy: "cache-and-network",
  })
  const [editing, setEditing] = useState<Job | "new" | null>(startNew ? "new" : null)
  const [createJob, { loading: creating }] = useMutation(CREATE_JOB)
  const [updateJob, { loading: updating }] = useMutation(UPDATE_JOB)
  const [setStatus] = useMutation(SET_JOB_STATUS)

  if (loading) return <ContentAreaLoader />
  if (!company) return <EmptyState title="Your account isn't linked to a company" />
  if (company.status !== "APPROVED") return <PendingNotice company={company} />

  const jobs = data?.myCompanyJobs ?? []
  const save = async (v: ReturnType<typeof jobFormFrom>) => {
    try {
      const input = jobInputFrom(v, false)
      if (editing === "new") await createJob({ variables: { input } })
      else if (editing) await updateJob({ variables: { id: editing.id, input } })
      toast.success("Job saved")
      setEditing(null)
      void refetch()
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save the job")
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{editing === "new" ? "Post a job" : "Edit job"}</h1>
        <div className="bg-card rounded-xl border p-5">
          <JobForm
            initial={jobFormFrom(editing === "new" ? null : editing)}
            saving={creating || updating}
            onSubmit={(v) => void save(v)}
            onCancel={() => setEditing(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <Button onClick={() => setEditing("new")}>
          <PlusIcon className="size-4" /> Post a job
        </Button>
      </div>
      {jobsLoading && !data ? (
        <ContentAreaLoader />
      ) : !jobs.length ? (
        <EmptyState title="No jobs yet">Post your first job and our students can apply with their portfolio.</EmptyState>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              href={jobPath(j.id)}
              actions={
                <>
                  <span className="text-muted-foreground mr-auto text-sm">
                    {j.source === "FEED" ? "Imported from your careers page" : `${j.applicationsCount ?? 0} applicants`}
                  </span>
                  {j.source !== "FEED" && j.applyMode === "PORTAL" && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${ROUTES.APPLICATIONS}?job=${j.id}`}>Applicants</Link>
                    </Button>
                  )}
                  {j.source !== "FEED" && (
                    <Button size="sm" variant="outline" onClick={() => setEditing(j)}>
                      <PencilIcon className="size-4" /> Edit
                    </Button>
                  )}
                  {j.source !== "FEED" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await setStatus({ variables: { id: j.id, status: j.status === "OPEN" ? "CLOSED" : "OPEN" } })
                            void refetch()
                          } catch (e) {
                            toast.error((e as Error).message || "Couldn't update")
                          }
                        }}
                      >
                        {j.status === "OPEN" ? "Close" : "Reopen"}
                      </Button>
                    </>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function EmployerApplicationsScreen({ initialJobId = "" }: { initialJobId?: string }) {
  const { company, loading } = useMyCompany()
  const { data: jobsData } = useQuery<{ myCompanyJobs: Job[] }>(GET_MY_COMPANY_JOBS, { skip: company?.status !== "APPROVED" })
  const portalJobs = (jobsData?.myCompanyJobs ?? []).filter((j) => j.applyMode === "PORTAL" && j.source !== "FEED")
  const [picked, setPicked] = useState(initialJobId)
  const [scheduling, setScheduling] = useState<Application | null>(null)
  const jobId = picked || portalJobs[0]?.id || ""
  const { data, loading: appsLoading } = useQuery<{ jobApplications: Application[] }>(GET_JOB_APPLICATIONS, {
    variables: { jobId },
    skip: !jobId,
    fetchPolicy: "cache-and-network",
  })

  if (loading) return <ContentAreaLoader />
  if (!company) return <EmptyState title="Your account isn't linked to a company" />
  if (company.status !== "APPROVED") return <PendingNotice company={company} />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Applicants</h1>
        {portalJobs.length > 0 && (
          <select aria-label="Job" className={`${selectClass} w-full sm:w-80`} value={jobId} onChange={(e) => setPicked(e.target.value)}>
            {portalJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.applicationsCount ?? 0}){j.status === "CLOSED" ? " · closed" : ""}
              </option>
            ))}
          </select>
        )}
      </div>
      {!portalJobs.length ? (
        <EmptyState title="No jobs taking applications here yet">Post a job with “Apply on TechOn Skills” to get applicants.</EmptyState>
      ) : appsLoading && !data ? (
        <ContentAreaLoader />
      ) : (
        <ApplicationsList applications={data?.jobApplications ?? []} empty="No one has applied for this job yet." onSchedule={setScheduling} />
      )}
      <InterviewDialog
        target={scheduling ? { kind: "application", applicationId: scheduling.id, studentName: scheduling.student?.fullName || "the student" } : null}
        onClose={() => setScheduling(null)}
      />
    </div>
  )
}
