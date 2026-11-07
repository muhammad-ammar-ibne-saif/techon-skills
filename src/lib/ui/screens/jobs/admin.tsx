"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import { CheckIcon, Loader2Icon, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon, UserPlusIcon, XIcon } from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import {
  ADMIN_CREATE_COMPANY,
  ADMIN_UPDATE_COMPANY,
  CREATE_JOB,
  DELETE_JOB,
  GET_ADMIN_COMPANIES,
  GET_ADMIN_JOBS,
  GET_ADMIN_JOB_APPLICATIONS,
  GET_JOB_FEED_SETTINGS,
  INVITE_COMPANY_MEMBER,
  REVIEW_COMPANY,
  RUN_JOB_FEED_IMPORT,
  SET_COMPANY_PARTNER,
  SET_JOB_STATUS,
  UPDATE_JOB,
  UPDATE_JOB_FEED_SETTINGS,
} from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ConfirmDialog } from "@/lib/ui/useable-components/confirm-dialog"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { AlumniReviewQueue } from "../careers/admin"
import { ApplicationsList } from "./applications"
import { CareersSyncCard } from "./employer"
import {
  CompanyForm,
  CompanyLogo,
  EmptyState,
  Field,
  JobCard,
  JobForm,
  PartnerBadge,
  Pill,
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

type Tab = "companies" | "jobs" | "applications" | "feeds"
const TABS: { id: Tab; label: string }[] = [
  { id: "companies", label: "Companies" },
  { id: "jobs", label: "Jobs" },
  { id: "applications", label: "Applications" },
  { id: "feeds", label: "Job feeds" },
]

const errorText = (e: unknown, fallback: string) => (e as Error)?.message || fallback

export function AdminJobsScreen() {
  const [tab, setTab] = useState<Tab>("companies")
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Companies & jobs</h1>
        <p className="text-muted-foreground text-sm">Approve companies, mark partners, post jobs and manage the job feeds.</p>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm",
              tab === t.id ? "border-(--brand-primary) font-medium" : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "companies" && <CompaniesTab />}
      {tab === "jobs" && <JobsTab />}
      {tab === "applications" && <ApplicationsTab />}
      {tab === "feeds" && <FeedsTab />}
    </div>
  )
}

/* ------------------------------------------------------------------ companies */

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
}

function CompanyRow({ c, onEdit, onChanged }: { c: Company; onEdit: () => void; onChanged: () => void }) {
  const [review, { loading: reviewing }] = useMutation(REVIEW_COMPANY)
  const [setPartner, { loading: partnering }] = useMutation(SET_COMPANY_PARTNER)
  const [invite, { loading: inviting }] = useMutation(INVITE_COMPANY_MEMBER)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")

  const doReview = async (approve: boolean) => {
    try {
      await review({ variables: { id: c.id, approve, note: approve ? null : note.trim() || null } })
      toast.success(approve ? "Approved. The company was emailed." : "Rejected. The company was emailed.")
      setRejecting(false)
      onChanged()
    } catch (e) {
      toast.error(errorText(e, "Couldn't update"))
    }
  }

  return (
    <div className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start gap-4">
        <CompanyLogo src={c.logo} name={c.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{c.name}</p>
            {c.status && <Pill className={STATUS_CLASS[c.status]}>{c.status.toLowerCase()}</Pill>}
            {c.isPartner && <PartnerBadge />}
          </div>
          <p className="text-muted-foreground text-sm">
            {[c.industry, c.city, c.size && `${c.size} people`].filter(Boolean).join(" · ") || "No details yet"}
          </p>
          <p className="text-muted-foreground text-xs">
            {c.contactName} · {c.contactEmail}
            {c.contactPhone ? ` · ${c.contactPhone}` : ""} · {c.openJobsCount} open jobs · joined {timeAgo(c.createdAt)}
          </p>
          {!!c.members?.length && <p className="text-muted-foreground text-xs">Accounts: {c.members.map((m) => m.email).join(", ")}</p>}
          {c.website && (
            <a href={c.website} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-(--site-accent)">
              {c.website}
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {c.status !== "APPROVED" && (
            <Button size="sm" variant="success" disabled={reviewing} onClick={() => void doReview(true)}>
              <CheckIcon className="size-4" /> Approve
            </Button>
          )}
          {c.status !== "REJECTED" && (
            <Button size="sm" variant="outline" onClick={() => setRejecting((v) => !v)}>
              <XIcon className="size-4" /> Reject
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={partnering}
            onClick={async () => {
              try {
                await setPartner({ variables: { id: c.id, isPartner: !c.isPartner } })
                onChanged()
              } catch (e) {
                toast.error(errorText(e, "Couldn't update"))
              }
            }}
          >
            {c.isPartner ? "Remove partner" : "Mark partner"}
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <PencilIcon className="size-4" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => setInviteOpen((v) => !v)}>
            <UserPlusIcon className="size-4" /> Add account
          </Button>
          {c.status === "APPROVED" && (
            <Button asChild size="sm" variant="ghost">
              <Link href={companyPath(c.slug)} target="_blank">
                Page
              </Link>
            </Button>
          )}
        </div>
      </div>
      {c.about && <p className="text-muted-foreground line-clamp-3 text-sm whitespace-pre-line">{c.about}</p>}
      {rejecting && (
        <div className="space-y-2 rounded-lg border p-3">
          <Field label="Reason (emailed to the company)" hint="Optional. Rejecting closes the company's open jobs.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" disabled={reviewing} onClick={() => void doReview(false)}>
              Reject company
            </Button>
          </div>
        </div>
      )}
      {inviteOpen && (
        <form
          className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await invite({ variables: { companyId: c.id, email: inviteEmail.trim(), fullName: inviteName.trim() || null } })
              toast.success(c.status === "APPROVED" ? "Account added and emailed how to sign in" : "Account added; it can sign in once approved")
              setInviteOpen(false)
              setInviteEmail("")
              setInviteName("")
              onChanged()
            } catch (err) {
              toast.error(errorText(err, "Couldn't add the account"))
            }
          }}
        >
          <Field label="Email" className="min-w-56 flex-1">
            <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
          </Field>
          <Field label="Name" className="min-w-40 flex-1">
            <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
          </Field>
          <Button type="submit" size="sm" disabled={inviting}>
            Add account
          </Button>
        </form>
      )}
    </div>
  )
}

function CompaniesTab() {
  const [status, setStatus] = useState("")
  const { data, loading, refetch } = useQuery<{ adminCompanies: Company[] }>(GET_ADMIN_COMPANIES, {
    variables: { status: status || null },
    fetchPolicy: "cache-and-network",
  })
  const [editing, setEditing] = useState<Company | "new" | null>(null)
  const [partnerOnCreate, setPartnerOnCreate] = useState(true)
  const [create, { loading: creating }] = useMutation(ADMIN_CREATE_COMPANY)
  const [update, { loading: updating }] = useMutation(ADMIN_UPDATE_COMPANY)
  const companies = data?.adminCompanies ?? []
  const pending = companies.filter((c) => c.status === "PENDING").length

  const save = async (v: CompanyFormValues) => {
    try {
      if (editing === "new") await create({ variables: { input: v, isPartner: partnerOnCreate } })
      else if (editing) await update({ variables: { id: editing.id, input: v } })
      toast.success("Company saved")
      setEditing(null)
      void refetch()
    } catch (e) {
      toast.error(errorText(e, "Couldn't save"))
    }
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{editing === "new" ? "Add a company" : `Edit ${editing.name}`}</h2>
        {editing === "new" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={partnerOnCreate} onChange={(e) => setPartnerOnCreate(e.target.checked)} /> Partner (works with us)
          </label>
        )}
        <div className="bg-card rounded-xl border p-5">
          <CompanyForm
            initial={companyFormFrom(editing === "new" ? null : editing)}
            saving={creating || updating}
            submitLabel={editing === "new" ? "Add company" : "Save"}
            onSubmit={(v) => void save(v)}
            onCancel={() => setEditing(null)}
          />
        </div>
        {editing !== "new" && editing.careersProvider && <CareersSyncCard company={editing} companyId={editing.id} />}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Status" className={`${selectClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All companies</option>
          <option value="PENDING">Waiting for approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        {!status && pending > 0 && <span className="text-sm text-amber-700 dark:text-amber-400">{pending} waiting for approval</span>}
        <Button className="ml-auto" onClick={() => setEditing("new")}>
          <PlusIcon className="size-4" /> Add company
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Companies added here are approved straight away. To give someone at the company their own sign-in, use “Add account”.
      </p>
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !companies.length ? (
        <EmptyState title="No companies yet">Companies sign up at /hire, or add one here.</EmptyState>
      ) : (
        <div className="space-y-3">
          {companies.map((c) => (
            <CompanyRow key={c.id} c={c} onEdit={() => setEditing(c)} onChanged={() => void refetch()} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ jobs */

function JobsTab() {
  const [source, setSource] = useState("")
  const [status, setStatus] = useState("OPEN")
  const [search, setSearch] = useState("")
  const [applied, setApplied] = useState("")
  const { data, loading, refetch } = useQuery<{ adminJobs: Job[] }>(GET_ADMIN_JOBS, {
    variables: { source: source || null, status: status || null, search: applied || null },
    fetchPolicy: "cache-and-network",
  })
  const { data: companiesData } = useQuery<{ adminCompanies: Company[] }>(GET_ADMIN_COMPANIES, { variables: { status: "APPROVED" } })
  const [editing, setEditing] = useState<Job | "new" | null>(null)
  const [deleting, setDeleting] = useState<Job | null>(null)
  const [createJob, { loading: creating }] = useMutation(CREATE_JOB)
  const [updateJob, { loading: updating }] = useMutation(UPDATE_JOB)
  const [setJobStatus] = useMutation(SET_JOB_STATUS)
  const [deleteJob, { loading: deletingNow }] = useMutation(DELETE_JOB)
  const jobs = data?.adminJobs ?? []
  const companies = (companiesData?.adminCompanies ?? []).map((c) => ({ id: c.id, name: c.name }))

  if (editing) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{editing === "new" ? "Post a job" : "Edit job"}</h2>
        <div className="bg-card rounded-xl border p-5">
          <JobForm
            initial={jobFormFrom(editing === "new" ? null : editing)}
            companies={companies}
            saving={creating || updating}
            onCancel={() => setEditing(null)}
            onSubmit={async (v) => {
              try {
                const input = jobInputFrom(v, true)
                if (editing === "new") await createJob({ variables: { input } })
                else await updateJob({ variables: { id: editing.id, input } })
                toast.success("Job saved")
                setEditing(null)
                void refetch()
              } catch (e) {
                toast.error(errorText(e, "Couldn't save the job"))
              }
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setApplied(search.trim())
          }}
        >
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-48" />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
        <select aria-label="Source" className={`${selectClass} w-auto`} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All sources</option>
          <option value="COMPANY">Posted by companies</option>
          <option value="ADMIN">Posted by admins</option>
          <option value="FEED">Imported</option>
          <option value="ALUMNI">Posted by graduates</option>
        </select>
        <select aria-label="Status" className={`${selectClass} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="">Open and closed</option>
        </select>
        <Button className="ml-auto" onClick={() => setEditing("new")}>
          <PlusIcon className="size-4" /> Post a job
        </Button>
      </div>
      <AlumniReviewQueue onChange={() => void refetch()} />
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !jobs.length ? (
        <EmptyState title="No jobs match" />
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
                    {j.source === "FEED"
                      ? "Imported"
                      : j.source === "ADMIN"
                        ? "Posted by admin"
                        : j.source === "ALUMNI"
                          ? `Posted by ${j.referrer?.fullName ?? "a graduate"}${j.awaitingReview ? " · waiting for approval" : ""}`
                          : "Posted by the company"}
                    {j.applyMode === "PORTAL" ? ` · ${j.applicationsCount ?? 0} applicants` : ""}
                  </span>
                  {j.source !== "FEED" && j.source !== "ALUMNI" && (
                    <Button size="sm" variant="outline" onClick={() => setEditing(j)}>
                      <PencilIcon className="size-4" /> Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await setJobStatus({ variables: { id: j.id, status: j.status === "OPEN" ? "CLOSED" : "OPEN" } })
                        void refetch()
                      } catch (e) {
                        toast.error(errorText(e, "Couldn't update"))
                      }
                    }}
                  >
                    {j.status === "OPEN" ? "Close" : "Reopen"}
                  </Button>
                  <Button size="sm" variant="ghost" aria-label="Delete job" onClick={() => setDeleting(j)}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        Imported jobs are refreshed every few hours; one you close may be reopened while its source still lists it. Turn the feed off to
        stop it.
      </p>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this job?"
        description="The job and all its applications are removed for good."
        confirmLabel="Delete"
        variant="destructive"
        loading={deletingNow}
        onConfirm={async () => {
          if (!deleting) return
          try {
            await deleteJob({ variables: { id: deleting.id } })
            toast.success("Job deleted")
            void refetch()
          } catch (e) {
            toast.error(errorText(e, "Couldn't delete"))
          } finally {
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ applications */

function ApplicationsTab() {
  const { data, loading } = useQuery<{ adminJobApplications: Application[] }>(GET_ADMIN_JOB_APPLICATIONS, { fetchPolicy: "cache-and-network" })
  if (loading && !data) return <ContentAreaLoader />
  return <ApplicationsList applications={data?.adminJobApplications ?? []} showJob empty="No applications yet." />
}

/* ------------------------------------------------------------------ feeds */

type FeedSettings = { remotive: boolean; arbeitnow: boolean; remoteok: boolean; keywords: string; lastRunAt: string | null; lastResult: string }

const FEEDS: { key: "remotive" | "arbeitnow" | "remoteok"; name: string; about: string }[] = [
  { key: "remotive", name: "Remotive", about: "Remote software jobs worldwide." },
  { key: "arbeitnow", name: "Arbeitnow", about: "Tech jobs, mostly in Europe, some remote." },
  { key: "remoteok", name: "Remote OK", about: "Remote jobs, many in tech." },
]

function FeedsForm({ initial }: { initial: FeedSettings }) {
  const [form, setForm] = useState(initial)
  const [save, { loading: saving }] = useMutation<{ updateJobFeedSettings: FeedSettings }>(UPDATE_JOB_FEED_SETTINGS)
  const [run, { loading: running }] = useMutation<{ runJobFeedImport: FeedSettings }>(RUN_JOB_FEED_IMPORT)
  const input = { remotive: form.remotive, arbeitnow: form.arbeitnow, remoteok: form.remoteok, keywords: form.keywords }

  return (
    <div className="space-y-5">
      <div className="bg-card space-y-4 rounded-xl border p-5">
        <p className="text-muted-foreground text-sm">
          Jobs are read from these free public job boards every 6 hours. Students apply on the original site. Jobs a board stops listing
          are closed here.
        </p>
        {FEEDS.map((f) => (
          <label key={f.key} className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={form[f.key]}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.checked }))}
            />
            <span>
              <span className="font-medium">{f.name}</span>
              <span className="text-muted-foreground block">{f.about}</span>
            </span>
          </label>
        ))}
        <Field label="Only import jobs whose title has one of these words" hint="Comma separated. Leave empty to import everything.">
          <Textarea value={form.keywords} onChange={(e) => setForm((s) => ({ ...s, keywords: e.target.value }))} rows={3} maxLength={1000} />
        </Field>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            disabled={running || saving}
            onClick={async () => {
              try {
                await save({ variables: { input } })
                const res = await run()
                if (res.data) setForm(res.data.runJobFeedImport)
                toast.success("Import finished")
              } catch (e) {
                toast.error(errorText(e, "Import failed"))
              }
            }}
          >
            {running ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />} Save & import now
          </Button>
          <Button
            disabled={saving || running}
            onClick={async () => {
              try {
                await save({ variables: { input } })
                toast.success("Saved")
              } catch (e) {
                toast.error(errorText(e, "Couldn't save"))
              }
            }}
          >
            Save
          </Button>
        </div>
      </div>
      <div className="text-muted-foreground text-sm">
        {form.lastRunAt ? (
          <>
            Last import {timeAgo(form.lastRunAt)}: {form.lastResult || "—"}
          </>
        ) : (
          "Not imported yet."
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        Companies can also connect their own careers page (Greenhouse, Lever, Ashby, Workable or Recruitee) in their profile; those jobs are
        imported as the company&apos;s own.
      </p>
    </div>
  )
}

function FeedsTab() {
  const { data, loading } = useQuery<{ jobFeedSettings: FeedSettings }>(GET_JOB_FEED_SETTINGS, { fetchPolicy: "network-only" })
  if (loading && !data) return <ContentAreaLoader />
  if (!data) return <EmptyState title="Couldn't load the feed settings" />
  return <FeedsForm initial={data.jobFeedSettings} />
}
