"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { BadgeCheckIcon, Building2Icon, ClockIcon, ImagePlusIcon, Loader2Icon, MapPinIcon } from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import { getImageSrc } from "@/lib/helpers/image"
import { apiService } from "@/lib/services/api"
import { Button } from "@/lib/ui/useable-components/button"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { CONFIG } from "@/utils/constants"

/* ------------------------------------------------------------------ types */

export type JobType = "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT"
export type WorkMode = "ONSITE" | "REMOTE" | "HYBRID"
export type ApplicationStatus = "SUBMITTED" | "VIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED"

export type CompanyLite = { id: string; name: string; slug: string; logo: string; isPartner: boolean }

export type Company = CompanyLite & {
  website: string
  about: string
  industry: string
  size: string
  city: string
  openJobsCount: number
  linkedin: string
  facebook: string
  instagram: string
  twitter: string
  careersProvider: string
  status?: "PENDING" | "APPROVED" | "REJECTED"
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  reviewNote?: string | null
  careersHandle?: string | null
  careersSyncedAt?: string | null
  careersSyncResult?: string | null
  members?: { id: string; fullName: string; email: string }[] | null
  createdAt?: string
}

export type Job = {
  id: string
  source: "COMPANY" | "ADMIN" | "FEED"
  companyName: string
  companyLogo: string
  fromPartner: boolean
  title: string
  description: string
  location: string
  workMode: WorkMode
  jobType: JobType
  experience: string
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  skills: string[]
  applyMode: "PORTAL" | "EXTERNAL"
  applyUrl: string
  status: "OPEN" | "CLOSED"
  deadline: string | null
  postedAt: string
  feedSource: string | null
  company: CompanyLite | null
  applicationsCount?: number | null
  myApplication?: { id: string; status: ApplicationStatus; createdAt: string } | null
}

export type Applicant = {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  profilePicture: string
  portfolioSlug: string | null
}

export type Application = {
  id: string
  coverNote: string
  portfolioUrl: string
  cvUrl: string
  tailoredCv?: boolean
  projects?: { title: string; url: string; reason: string }[]
  status: ApplicationStatus
  statusChangedAt: string | null
  createdAt: string
  student?: Applicant | null
  job?: { id: string; title: string; companyName: string; companyLogo?: string; status?: string; company?: { slug: string } | null } | null
}

/* ------------------------------------------------------------------ labels */

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
}
export const WORK_MODE_LABEL: Record<WorkMode, string> = { ONSITE: "On-site", REMOTE: "Remote", HYBRID: "Hybrid" }
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: "Sent",
  VIEWED: "Viewed",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Not selected",
  HIRED: "Hired",
}
export const APPLICATION_STATUS_CLASS: Record<ApplicationStatus, string> = {
  SUBMITTED: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  VIEWED: "bg-muted text-muted-foreground",
  SHORTLISTED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  REJECTED: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  HIRED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
}
export const CAREERS_PROVIDER_LABEL: Record<string, string> = {
  GREENHOUSE: "Greenhouse",
  LEVER: "Lever",
  ASHBY: "Ashby",
  WORKABLE: "Workable",
  RECRUITEE: "Recruitee",
}
export const CAREERS_PROVIDER_EXAMPLE: Record<string, string> = {
  GREENHOUSE: "boards.greenhouse.io/acme",
  LEVER: "jobs.lever.co/acme",
  ASHBY: "jobs.ashbyhq.com/acme",
  WORKABLE: "apply.workable.com/acme",
  RECRUITEE: "acme.recruitee.com",
}

export const selectClass = "border-input bg-background h-9 w-full rounded-md border px-3 text-sm"

export function formatSalary(job: Pick<Job, "salaryMin" | "salaryMax" | "salaryCurrency">): string {
  const fmt = (n: number) => n.toLocaleString("en-US")
  const cur = job.salaryCurrency || "PKR"
  if (job.salaryMin != null && job.salaryMax != null) return `${cur} ${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
  if (job.salaryMin != null) return `From ${cur} ${fmt(job.salaryMin)}`
  if (job.salaryMax != null) return `Up to ${cur} ${fmt(job.salaryMax)}`
  return ""
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ""
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export const portfolioPath = (slug: string) => `${CONFIG.ROUTES.PUBLIC.PORTFOLIO}/${slug}`
export const jobPath = (id: string) => `${CONFIG.ROUTES.PUBLIC.JOBS}/${id}`
export const companyPath = (slug: string) => `${CONFIG.ROUTES.PUBLIC.COMPANIES}/${slug}`

/* ------------------------------------------------------------------ small pieces */

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium", className)}>{children}</span>
}

export function PartnerBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-(--site-accent)/12 px-2 py-0.5 text-[11px] font-medium text-(--site-accent)",
        className
      )}
      title="Works with TechOn Skills"
    >
      <BadgeCheckIcon className="size-3.5" /> Partner
    </span>
  )
}

export function StatusPill({ status }: { status: ApplicationStatus }) {
  return <Pill className={APPLICATION_STATUS_CLASS[status]}>{APPLICATION_STATUS_LABEL[status]}</Pill>
}

export function CompanyLogo({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const url = getImageSrc(src)
  return (
    <div className={cn("bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${name} logo`} className="size-full object-contain" />
      ) : (
        <Building2Icon className="text-muted-foreground size-5" />
      )}
    </div>
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-muted-foreground block text-xs">{hint}</span>}
    </label>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="text-muted-foreground mt-1 text-sm">{children}</div>}
    </div>
  )
}

/** One job in a list. */
export function JobCard({ job, href, actions }: { job: Job; href?: string; actions?: ReactNode }) {
  const salary = formatSalary(job)
  const body = (
    <div className="flex gap-4">
      <CompanyLogo src={job.company?.logo || job.companyLogo} name={job.companyName} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold">{job.title}</h3>
          {job.fromPartner && <PartnerBadge />}
          {job.status === "CLOSED" && <Pill>Closed</Pill>}
        </div>
        <p className="text-muted-foreground text-sm">{job.companyName}</p>
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-3.5" /> {job.location}
            </span>
          )}
          <span>{WORK_MODE_LABEL[job.workMode]}</span>
          <span>{JOB_TYPE_LABEL[job.jobType]}</span>
          {salary && <span>{salary}</span>}
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" /> {timeAgo(job.postedAt)}
          </span>
          {job.feedSource && <span>via {job.feedSource}</span>}
        </div>
      </div>
    </div>
  )
  return (
    <div className="bg-card hover:border-foreground/20 rounded-xl border p-4 transition-colors">
      {href ? (
        <Link href={href} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
      {actions && <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">{actions}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ company form */

export type CompanyFormValues = {
  name: string
  logo: string
  website: string
  about: string
  industry: string
  size: string
  city: string
  contactName: string
  contactEmail: string
  contactPhone: string
  linkedin: string
  facebook: string
  instagram: string
  twitter: string
  careersProvider: string
  careersHandle: string
}

export function companyFormFrom(c?: Partial<Company> | null): CompanyFormValues {
  return {
    name: c?.name ?? "",
    logo: c?.logo ?? "",
    website: c?.website ?? "",
    about: c?.about ?? "",
    industry: c?.industry ?? "",
    size: c?.size ?? "",
    city: c?.city ?? "",
    contactName: c?.contactName ?? "",
    contactEmail: c?.contactEmail ?? "",
    contactPhone: c?.contactPhone ?? "",
    linkedin: c?.linkedin ?? "",
    facebook: c?.facebook ?? "",
    instagram: c?.instagram ?? "",
    twitter: c?.twitter ?? "",
    careersProvider: c?.careersProvider ?? "",
    careersHandle: c?.careersHandle ?? "",
  }
}

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"]

/** Company profile fields, shared by the employer and admin screens. */
export function CompanyForm({
  initial,
  saving,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  initial: CompanyFormValues
  saving: boolean
  submitLabel?: string
  onSubmit: (values: CompanyFormValues) => void
  onCancel?: () => void
}) {
  const [form, setForm] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const set = (k: keyof CompanyFormValues) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const uploadLogo = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) return toast.error("Pick an image")
    if (file.size > 2 * 1024 * 1024) return toast.error("Logo must be under 2 MB")
    setUploading(true)
    try {
      const res = await apiService.uploadImage(file, "companies")
      if (res.success && res.data?.url) setForm((f) => ({ ...f, logo: res.data!.url }))
      else toast.error(res.message || "Couldn't upload the logo")
    } catch {
      toast.error("Couldn't upload the logo")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
    >
      <section className="space-y-4">
        <h3 className="font-semibold">Company</h3>
        <div className="flex items-center gap-4">
          <CompanyLogo src={form.logo} name={form.name || "Company"} className="size-16" />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
            {uploading ? <Loader2Icon className="size-4 animate-spin" /> : <ImagePlusIcon className="size-4" />}
            {form.logo ? "Change logo" : "Upload logo"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void uploadLogo(e.target.files?.[0])} />
          </label>
          {form.logo && (
            <button type="button" className="text-muted-foreground text-sm underline" onClick={() => setForm((f) => ({ ...f, logo: "" }))}>
              Remove
            </button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name">
            <Input value={form.name} onChange={set("name")} required maxLength={120} />
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={set("website")} placeholder="https://" />
          </Field>
          <Field label="Industry">
            <Input value={form.industry} onChange={set("industry")} placeholder="Software house" maxLength={80} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={set("city")} placeholder="Lahore" maxLength={80} />
          </Field>
          <Field label="Team size">
            <select value={form.size} onChange={set("size")} className={selectClass}>
              <option value="">Not set</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} people
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="About">
          <Textarea value={form.about} onChange={set("about")} rows={5} maxLength={3000} placeholder="What you build and who you hire" />
        </Field>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Contact</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Contact person">
            <Input value={form.contactName} onChange={set("contactName")} maxLength={120} />
          </Field>
          <Field label="Contact email" hint="Applications are emailed here.">
            <Input type="email" value={form.contactEmail} onChange={set("contactEmail")} required />
          </Field>
          <Field label="Phone">
            <Input value={form.contactPhone} onChange={set("contactPhone")} maxLength={40} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Social pages</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn">
            <Input value={form.linkedin} onChange={set("linkedin")} placeholder="https://www.linkedin.com/company/…" />
          </Field>
          <Field label="Facebook">
            <Input value={form.facebook} onChange={set("facebook")} placeholder="https://www.facebook.com/…" />
          </Field>
          <Field label="Instagram">
            <Input value={form.instagram} onChange={set("instagram")} placeholder="https://www.instagram.com/…" />
          </Field>
          <Field label="X (Twitter)">
            <Input value={form.twitter} onChange={set("twitter")} placeholder="https://x.com/…" />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">Import jobs automatically</h3>
          <p className="text-muted-foreground text-sm">
            If you post jobs on Greenhouse, Lever, Ashby, Workable or Recruitee, connect your careers page and your jobs appear here
            on their own, every few hours. LinkedIn doesn&apos;t let other sites read company job posts, so jobs posted only on LinkedIn
            need to be added here as well.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hiring system">
            <select value={form.careersProvider} onChange={set("careersProvider")} className={selectClass}>
              <option value="">Not connected</option>
              {Object.entries(CAREERS_PROVIDER_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          {form.careersProvider && (
            <Field label="Careers page" hint={`Paste the link or just the name, e.g. ${CAREERS_PROVIDER_EXAMPLE[form.careersProvider] ?? ""}`}>
              <Input value={form.careersHandle} onChange={set("careersHandle")} required />
            </Field>
          )}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving || uploading}>
          {saving && <Loader2Icon className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ job form */

export type JobFormValues = {
  title: string
  description: string
  location: string
  workMode: WorkMode
  jobType: JobType
  experience: string
  salaryMin: string
  salaryMax: string
  salaryCurrency: string
  skills: string
  applyMode: "PORTAL" | "EXTERNAL"
  applyUrl: string
  deadline: string
  companyId: string
  companyName: string
}

export function jobFormFrom(j?: Partial<Job> | null): JobFormValues {
  return {
    title: j?.title ?? "",
    description: j?.description ?? "",
    location: j?.location ?? "",
    workMode: j?.workMode ?? "ONSITE",
    jobType: j?.jobType ?? "FULL_TIME",
    experience: j?.experience ?? "",
    salaryMin: j?.salaryMin != null ? String(j.salaryMin) : "",
    salaryMax: j?.salaryMax != null ? String(j.salaryMax) : "",
    salaryCurrency: j?.salaryCurrency || "PKR",
    skills: (j?.skills ?? []).join(", "),
    applyMode: j?.applyMode ?? "PORTAL",
    applyUrl: j?.applyUrl ?? "",
    deadline: j?.deadline ?? "",
    companyId: j?.company?.id ?? "",
    companyName: j?.company ? "" : (j?.companyName ?? ""),
  }
}

/** The JobInput for the API. */
export function jobInputFrom(v: JobFormValues, withCompany: boolean) {
  const num = (s: string) => (s.trim() === "" ? null : Math.round(Number(s)))
  return {
    title: v.title,
    description: v.description,
    location: v.location,
    workMode: v.workMode,
    jobType: v.jobType,
    experience: v.experience,
    salaryMin: num(v.salaryMin),
    salaryMax: num(v.salaryMax),
    salaryCurrency: v.salaryCurrency,
    skills: v.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    applyMode: v.applyMode,
    applyUrl: v.applyUrl,
    deadline: v.deadline || null,
    ...(withCompany ? { companyId: v.companyId || null, companyName: v.companyId ? null : v.companyName } : {}),
  }
}

export function JobForm({
  initial,
  saving,
  companies,
  onSubmit,
  onCancel,
}: {
  initial: JobFormValues
  saving: boolean
  /** Admins pick a company (or type an outside one); employers post for their own. */
  companies?: { id: string; name: string }[]
  onSubmit: (values: JobFormValues) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof JobFormValues) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }) as JobFormValues)
  const outside = !!companies && !form.companyId

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(outside ? { ...form, applyMode: "EXTERNAL" } : form)
      }}
    >
      {companies && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company">
            <select value={form.companyId} onChange={set("companyId")} className={selectClass}>
              <option value="">Outside company (not on the portal)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          {outside && (
            <Field label="Company name">
              <Input value={form.companyName} onChange={set("companyName")} required maxLength={120} />
            </Field>
          )}
        </div>
      )}
      <Field label="Job title">
        <Input value={form.title} onChange={set("title")} required maxLength={140} placeholder="Junior React Developer" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type">
          <select value={form.jobType} onChange={set("jobType")} className={selectClass}>
            {Object.entries(JOB_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Work mode">
          <select value={form.workMode} onChange={set("workMode")} className={selectClass}>
            {Object.entries(WORK_MODE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <Input value={form.location} onChange={set("location")} placeholder="Lahore" maxLength={120} />
        </Field>
        <Field label="Experience">
          <Input value={form.experience} onChange={set("experience")} placeholder="0–1 years" maxLength={60} />
        </Field>
        <Field label="Salary from (per month)">
          <Input type="number" min={0} value={form.salaryMin} onChange={set("salaryMin")} />
        </Field>
        <Field label="Salary to">
          <Input type="number" min={0} value={form.salaryMax} onChange={set("salaryMax")} />
        </Field>
        <Field label="Currency">
          <select value={form.salaryCurrency} onChange={set("salaryCurrency")} className={selectClass}>
            {["PKR", "USD", "EUR", "GBP", "AED"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Last date to apply" hint="Optional">
          <Input type="date" value={form.deadline} onChange={set("deadline")} />
        </Field>
      </div>
      <Field label="Skills" hint="Comma separated, e.g. React, Node.js, SQL">
        <Input value={form.skills} onChange={set("skills")} />
      </Field>
      <Field label="Description">
        <Textarea value={form.description} onChange={set("description")} rows={8} maxLength={12000} placeholder="What the role is, what you expect, what you offer" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {!outside && (
          <Field label="How students apply">
            <select value={form.applyMode} onChange={set("applyMode")} className={selectClass}>
              <option value="PORTAL">On TechOn Skills (you get their portfolio by email)</option>
              <option value="EXTERNAL">On our own site</option>
            </select>
          </Field>
        )}
        {(outside || form.applyMode === "EXTERNAL") && (
          <Field label="Apply link">
            <Input value={form.applyUrl} onChange={set("applyUrl")} placeholder="https://" required />
          </Field>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2Icon className="size-4 animate-spin" />}
          Save job
        </Button>
      </div>
    </form>
  )
}
