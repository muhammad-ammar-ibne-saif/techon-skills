"use client"

import { useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import { CopyIcon, ExternalLinkIcon, EyeIcon, Loader2Icon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react"
import toast from "react-hot-toast"

import { GET_MY_JOB_APPLICATIONS, GET_MY_PORTFOLIO, UPDATE_MY_PORTFOLIO } from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { apiService } from "@/lib/services"
import { CONFIG } from "@/utils/constants"
import { PortfolioView, type Portfolio } from "./public"
import { CompanyLogo, EmptyState, Field, StatusPill, companyPath, jobPath, portfolioPath, timeAgo, type Application } from "./shared"

/* ------------------------------------------------------------------ portfolio editor */

type Project = Portfolio["projects"][number]
type Experience = Portfolio["experience"][number]
type Education = Portfolio["education"][number]
type LinkItem = Portfolio["links"][number]

type Form = {
  slug: string
  headline: string
  bio: string
  location: string
  skills: string
  github: string
  linkedin: string
  website: string
  cvUrl: string
  links: LinkItem[]
  projects: (Omit<Project, "tech"> & { tech: string })[]
  experience: Experience[]
  education: Education[]
  openToWork: boolean
  isPublic: boolean
  showMarks: boolean
}

const formFrom = (p: Portfolio): Form => ({
  slug: p.slug,
  headline: p.headline,
  bio: p.bio,
  location: p.location,
  skills: p.skills.join(", "),
  github: p.github,
  linkedin: p.linkedin,
  website: p.website,
  cvUrl: p.cvUrl,
  // Copy field by field: results carry __typename, which the input types don't accept.
  links: p.links.map((l) => ({ label: l.label, url: l.url })),
  projects: p.projects.map((x) => ({
    title: x.title,
    description: x.description,
    url: x.url,
    repoUrl: x.repoUrl,
    image: x.image,
    tech: x.tech.join(", "),
  })),
  experience: p.experience.map((x) => ({ role: x.role, company: x.company, start: x.start, end: x.end, description: x.description })),
  education: p.education.map((x) => ({ school: x.school, degree: x.degree, start: x.start, end: x.end })),
  openToWork: p.openToWork,
  isPublic: p.isPublic,
  showMarks: p.showMarks,
})

const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)

const inputFrom = (f: Form) => ({
  ...f,
  skills: list(f.skills),
  projects: f.projects.map((x) => ({ ...x, tech: list(x.tech) })),
})

const blankProject = { title: "", description: "", url: "", repoUrl: "", image: "", tech: "" }
const blankExperience: Experience = { role: "", company: "", start: "", end: "", description: "" }
const blankEducation: Education = { school: "", degree: "", start: "", end: "" }

export function Section({ title, hint, children, onAdd, addLabel }: { title: string; hint?: string; children: ReactNode; onAdd?: () => void; addLabel?: string }) {
  return (
    <section className="bg-card space-y-4 rounded-xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
        </div>
        {onAdd && (
          <Button type="button" size="sm" variant="outline" onClick={onAdd}>
            <PlusIcon className="size-4" /> {addLabel}
          </Button>
        )}
      </div>
      {children}
    </section>
  )
}

export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="ghost" aria-label="Remove" onClick={onClick}>
      <Trash2Icon className="size-4" />
    </Button>
  )
}

function PortfolioEditor({ initial }: { initial: Portfolio }) {
  const [form, setForm] = useState(() => formFrom(initial))
  const [saved, setSaved] = useState(initial)
  const [preview, setPreview] = useState(false)
  const [save, { loading }] = useMutation<{ updateMyPortfolio: Portfolio }>(UPDATE_MY_PORTFOLIO)
  const cvInput = useRef<HTMLInputElement>(null)
  const [uploadingCv, setUploadingCv] = useState(false)
  const uploadCv = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("The PDF must be 5MB or smaller.")
      return
    }
    setUploadingCv(true)
    try {
      const res = await apiService.uploadImage(file, "cvs")
      if (!res?.success || !res.data?.url) throw new Error(res?.message || "Upload failed")
      setForm((f) => ({ ...f, cvUrl: res.data!.url }))
      toast.success("CV uploaded. Save your portfolio to keep it.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploadingCv(false)
      if (cvInput.current) cvInput.current.value = ""
    }
  }
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setItem = <K extends "links" | "projects" | "experience" | "education">(k: K, i: number, patch: Partial<Form[K][number]>) =>
    setForm((f) => ({ ...f, [k]: f[k].map((x, j) => (j === i ? { ...x, ...patch } : x)) }))
  const removeItem = (k: "links" | "projects" | "experience" | "education", i: number) =>
    setForm((f) => ({ ...f, [k]: (f[k] as unknown[]).filter((_, j) => j !== i) }))
  const link = typeof window !== "undefined" ? `${window.location.origin}${portfolioPath(saved.slug)}` : saved.url

  const submit = async () => {
    try {
      const res = await save({ variables: { input: inputFrom(form) } })
      if (res.data) {
        setSaved(res.data.updateMyPortfolio)
        setForm(formFrom(res.data.updateMyPortfolio))
      }
      toast.success("Portfolio saved")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My portfolio</h1>
          <p className="text-muted-foreground text-sm">Companies see this when you apply. Share the link anywhere.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link)
                toast.success("Link copied")
              } catch {
                toast.error("Couldn't copy")
              }
            }}
          >
            <CopyIcon className="size-4" /> Copy link
          </Button>
          <Button variant="outline" onClick={() => setPreview((v) => !v)}>
            <EyeIcon className="size-4" /> {preview ? "Edit" : "Preview"}
          </Button>
          <Button asChild variant="outline">
            <Link href={portfolioPath(saved.slug)} target="_blank">
              <ExternalLinkIcon className="size-4" /> Open
            </Link>
          </Button>
        </div>
      </div>
      <p className="bg-muted/50 rounded-lg px-3 py-2 font-mono text-sm break-all">{link}</p>

      {preview ? (
        <div className="bg-card rounded-xl border p-6">
          <PortfolioView p={saved} />
          <p className="text-muted-foreground mt-6 text-xs">This shows what you last saved.</p>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <Section title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link name" hint="Letters, numbers and dashes, e.g. ali-raza">
                <Input value={form.slug} onChange={set("slug")} required minLength={3} maxLength={40} />
              </Field>
              <Field label="Headline">
                <Input value={form.headline} onChange={set("headline")} maxLength={120} placeholder="Frontend developer · React & Next.js" />
              </Field>
              <Field label="City">
                <Input value={form.location} onChange={set("location")} maxLength={80} />
              </Field>
              <Field label="Skills" hint="Comma separated">
                <Input value={form.skills} onChange={set("skills")} placeholder="React, Node.js, SQL" />
              </Field>
            </div>
            <Field label="About me">
              <Textarea value={form.bio} onChange={set("bio")} rows={5} maxLength={2000} />
            </Field>
            <div className="flex flex-wrap gap-5 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} />
                Anyone with the link can see it
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.openToWork} onChange={(e) => setForm((f) => ({ ...f, openToWork: e.target.checked }))} />
                Open to work
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.showMarks} onChange={(e) => setForm((f) => ({ ...f, showMarks: e.target.checked }))} />
                Show my average mark
              </label>
            </div>
            {!form.isPublic && (
              <p className="text-muted-foreground text-xs">Private: only you, our staff and companies you apply to can open it.</p>
            )}
          </Section>

          <Section title="Links" hint="Upload your CV as a PDF, or paste a Google Drive or Dropbox link (set to “anyone with the link”).">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CV link">
                <div className="flex gap-2">
                  <Input value={form.cvUrl} onChange={set("cvUrl")} placeholder="https://drive.google.com/…" />
                  <input
                    ref={cvInput}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => void uploadCv(e.target.files?.[0])}
                  />
                  <Button type="button" variant="outline" disabled={uploadingCv} onClick={() => cvInput.current?.click()} className="shrink-0 gap-1">
                    {uploadingCv ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
                    PDF
                  </Button>
                </div>
              </Field>
              <Field label="GitHub">
                <Input value={form.github} onChange={set("github")} placeholder="https://github.com/…" />
              </Field>
              <Field label="LinkedIn">
                <Input value={form.linkedin} onChange={set("linkedin")} placeholder="https://www.linkedin.com/in/…" />
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={set("website")} placeholder="https://" />
              </Field>
            </div>
            {form.links.map((l, i) => (
              <div key={i} className="flex items-end gap-2">
                <Field label="Label" className="w-40">
                  <Input value={l.label} onChange={(e) => setItem("links", i, { label: e.target.value })} maxLength={40} />
                </Field>
                <Field label="Link" className="flex-1">
                  <Input value={l.url} onChange={(e) => setItem("links", i, { url: e.target.value })} required />
                </Field>
                <RemoveButton onClick={() => removeItem("links", i)} />
              </div>
            ))}
            {form.links.length < 8 && (
              <Button type="button" size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, links: [...f.links, { label: "", url: "" }] }))}>
                <PlusIcon className="size-4" /> Add a link
              </Button>
            )}
          </Section>

          <Section
            title="Projects"
            hint="What you built: the best way to show what you can do."
            addLabel="Add project"
            onAdd={form.projects.length < 12 ? () => setForm((f) => ({ ...f, projects: [...f.projects, { ...blankProject }] })) : undefined}
          >
            {!form.projects.length && <p className="text-muted-foreground text-sm">No projects yet.</p>}
            {form.projects.map((x, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-end gap-2">
                  <Field label="Title" className="flex-1">
                    <Input value={x.title} onChange={(e) => setItem("projects", i, { title: e.target.value })} required maxLength={100} />
                  </Field>
                  <RemoveButton onClick={() => removeItem("projects", i)} />
                </div>
                <Field label="What it does">
                  <Textarea value={x.description} onChange={(e) => setItem("projects", i, { description: e.target.value })} rows={3} maxLength={1000} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Live link">
                    <Input value={x.url} onChange={(e) => setItem("projects", i, { url: e.target.value })} placeholder="https://" />
                  </Field>
                  <Field label="Code link">
                    <Input value={x.repoUrl} onChange={(e) => setItem("projects", i, { repoUrl: e.target.value })} placeholder="https://github.com/…" />
                  </Field>
                  <Field label="Screenshot link" hint="Optional, https only">
                    <Input value={x.image} onChange={(e) => setItem("projects", i, { image: e.target.value })} placeholder="https://" />
                  </Field>
                  <Field label="Built with" hint="Comma separated">
                    <Input value={x.tech} onChange={(e) => setItem("projects", i, { tech: e.target.value })} />
                  </Field>
                </div>
              </div>
            ))}
          </Section>

          <Section
            title="Experience"
            addLabel="Add experience"
            onAdd={form.experience.length < 10 ? () => setForm((f) => ({ ...f, experience: [...f.experience, { ...blankExperience }] })) : undefined}
          >
            {!form.experience.length && <p className="text-muted-foreground text-sm">Internships, freelance work or jobs.</p>}
            {form.experience.map((x, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_8rem_auto] sm:items-end">
                  <Field label="Role">
                    <Input value={x.role} onChange={(e) => setItem("experience", i, { role: e.target.value })} required maxLength={100} />
                  </Field>
                  <Field label="Company">
                    <Input value={x.company} onChange={(e) => setItem("experience", i, { company: e.target.value })} required maxLength={100} />
                  </Field>
                  <Field label="From">
                    <Input value={x.start} onChange={(e) => setItem("experience", i, { start: e.target.value })} placeholder="Jan 2025" maxLength={20} />
                  </Field>
                  <Field label="To">
                    <Input value={x.end} onChange={(e) => setItem("experience", i, { end: e.target.value })} placeholder="Present" maxLength={20} />
                  </Field>
                  <RemoveButton onClick={() => removeItem("experience", i)} />
                </div>
                <Field label="What you did">
                  <Textarea value={x.description} onChange={(e) => setItem("experience", i, { description: e.target.value })} rows={2} maxLength={1000} />
                </Field>
              </div>
            ))}
          </Section>

          <Section
            title="Education"
            addLabel="Add education"
            onAdd={form.education.length < 6 ? () => setForm((f) => ({ ...f, education: [...f.education, { ...blankEducation }] })) : undefined}
          >
            {form.education.map((x, i) => (
              <div key={i} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_8rem_8rem_auto] sm:items-end">
                <Field label="School or university">
                  <Input value={x.school} onChange={(e) => setItem("education", i, { school: e.target.value })} required maxLength={120} />
                </Field>
                <Field label="Degree">
                  <Input value={x.degree} onChange={(e) => setItem("education", i, { degree: e.target.value })} maxLength={120} />
                </Field>
                <Field label="From">
                  <Input value={x.start} onChange={(e) => setItem("education", i, { start: e.target.value })} maxLength={20} />
                </Field>
                <Field label="To">
                  <Input value={x.end} onChange={(e) => setItem("education", i, { end: e.target.value })} maxLength={20} />
                </Field>
                <RemoveButton onClick={() => removeItem("education", i)} />
              </div>
            ))}
          </Section>

          <p className="text-muted-foreground text-sm">Your certificates, courses and marks from TechOn Skills are added automatically.</p>
          <div className="bg-background/90 sticky bottom-0 flex justify-end border-t py-3 backdrop-blur">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2Icon className="size-4 animate-spin" />} Save portfolio
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export function StudentPortfolioScreen() {
  const { data, loading, error } = useQuery<{ myPortfolio: Portfolio }>(GET_MY_PORTFOLIO, { fetchPolicy: "network-only" })
  if (loading && !data) return <ContentAreaLoader />
  if (!data) return <EmptyState title="Couldn't load your portfolio">{error?.message}</EmptyState>
  return <PortfolioEditor key={data.myPortfolio.slug} initial={data.myPortfolio} />
}

/* ------------------------------------------------------------------ my applications */

/** The student's applications (the Applications tab of the jobs hub). */
export function MyApplicationsList() {
  const { data, loading } = useQuery<{ myJobApplications: Application[] }>(GET_MY_JOB_APPLICATIONS, { fetchPolicy: "cache-and-network" })
  const apps = data?.myJobApplications ?? []
  return (
    <div>
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !apps.length ? (
        <EmptyState title="You haven't applied for any jobs yet">
          <Link href={CONFIG.ROUTES.PUBLIC.JOBS} className="text-(--site-accent)">
            See open jobs
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="bg-card flex flex-wrap items-center gap-4 rounded-xl border p-4">
              <CompanyLogo src={a.job?.companyLogo} name={a.job?.companyName ?? "Company"} />
              <div className="min-w-0 flex-1">
                {a.job ? (
                  <Link href={jobPath(a.job.id)} className="font-semibold hover:underline">
                    {a.job.title}
                  </Link>
                ) : (
                  <p className="font-semibold">Job removed</p>
                )}
                <p className="text-muted-foreground text-sm">
                  {a.job?.company?.slug ? (
                    <Link href={companyPath(a.job.company.slug)} className="hover:text-foreground">
                      {a.job.companyName}
                    </Link>
                  ) : (
                    a.job?.companyName
                  )}{" "}
                  · Applied {timeAgo(a.createdAt)}
                  {a.job?.status === "CLOSED" && " · Job closed"}
                </p>
              </div>
              <StatusPill status={a.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
