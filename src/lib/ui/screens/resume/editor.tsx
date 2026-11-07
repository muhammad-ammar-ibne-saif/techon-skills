"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  ArrowLeftIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
  SparklesIcon,
  UploadIcon,
  WandSparklesIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import {
  GET_MY_RESUME,
  GET_MY_TAILORED_RESUME,
  RESET_RESUME_FROM_PORTFOLIO,
  SAVE_RESUME,
  SET_RESUME_PDF,
  TAILOR_RESUME_FOR_JOB,
} from "@/lib/graphql"
import { cn } from "@/lib/helpers"
import { Button } from "@/lib/ui/useable-components/button"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { CONFIG } from "@/utils/constants"
import { EmptyState, Field, jobPath } from "../jobs/shared"
import { RemoveButton, Section } from "../jobs/student"
import {
  blankEducation,
  blankExperience,
  blankProject,
  buildResumePdf,
  downloadText,
  formFrom,
  inputFrom,
  MAX_PDF_BYTES,
  openInOverleaf,
  pdfDataFrom,
  uploadResumePdf,
  type Resume,
  type ResumeForm,
  type ResumeMode,
} from "./shared"

/* ------------------------------------------------------------------ preview */

/** An on-screen preview laid out like the PDF. */
function Preview({ form, portfolioUrl }: { form: ResumeForm; portfolioUrl: string }) {
  const d = pdfDataFrom({ ...form, portfolioUrl })
  const heading = "mb-1.5 border-b border-[#1f4e79] pb-0.5 text-[11px] font-bold tracking-wide text-[#1f4e79] uppercase"
  const a = "text-[#1f4e79] underline-offset-2 hover:underline"
  return (
    <div className="mx-auto w-full max-w-[640px] rounded-md border bg-white p-6 text-[12px] leading-snug text-[#222] shadow-sm sm:p-8">
      <p className="text-center text-xl font-bold">{d.fullName || "Your name"}</p>
      {d.headline && <p className="text-center text-[13px] text-[#444]">{d.headline}</p>}
      <p className="mt-1 flex flex-wrap justify-center gap-x-3 text-[11px]">
        {d.email && <span>{d.email}</span>}
        {d.phone && <span>{d.phone}</span>}
        {d.location && <span>{d.location}</span>}
        {d.portfolioUrl && (
          <a className={a} href={d.portfolioUrl} target="_blank" rel="noreferrer">
            Portfolio
          </a>
        )}
        {d.links.map((l, i) => (
          <a key={i} className={a} href={l.url} target="_blank" rel="noreferrer nofollow">
            {l.label || l.url}
          </a>
        ))}
      </p>
      {d.summary && (
        <div className="mt-3">
          <p className={heading}>Summary</p>
          <p className="whitespace-pre-line">{d.summary}</p>
        </div>
      )}
      {d.skills.length > 0 && (
        <div className="mt-3">
          <p className={heading}>Skills</p>
          <p>{d.skills.join(" · ")}</p>
        </div>
      )}
      {d.projects.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className={heading}>Projects</p>
          {d.projects.map((p, i) => (
            <div key={i}>
              <p className="flex justify-between gap-2">
                <span className="font-bold">{p.title}</span>
                <span className="flex gap-2 text-[11px]">
                  {p.url && (
                    <a className={a} href={p.url} target="_blank" rel="noreferrer nofollow">
                      Live
                    </a>
                  )}
                  {p.repoUrl && (
                    <a className={a} href={p.repoUrl} target="_blank" rel="noreferrer nofollow">
                      Code
                    </a>
                  )}
                  {p.portfolioLink && d.portfolioUrl && (
                    <a className={a} href={p.portfolioLink} target="_blank" rel="noreferrer">
                      Portfolio
                    </a>
                  )}
                </span>
              </p>
              {p.description && <p className="whitespace-pre-line">{p.description}</p>}
              {p.tech.length > 0 && <p className="text-[11px] text-[#555] italic">{p.tech.join(", ")}</p>}
            </div>
          ))}
        </div>
      )}
      {d.experience.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className={heading}>Experience</p>
          {d.experience.map((x, i) => (
            <div key={i}>
              <p className="flex justify-between gap-2">
                <span>
                  <b>{x.role}</b>
                  {x.company && `, ${x.company}`}
                </span>
                <span className="text-[11px] text-[#555]">{[x.start, x.end].filter(Boolean).join(" – ")}</span>
              </p>
              {x.description && <p className="whitespace-pre-line">{x.description}</p>}
            </div>
          ))}
        </div>
      )}
      {d.education.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className={heading}>Education</p>
          {d.education.map((x, i) => (
            <p key={i} className="flex justify-between gap-2">
              <span>
                <b>{x.degree}</b>
                {x.school && `, ${x.school}`}
              </span>
              <span className="text-[11px] text-[#555]">{[x.start, x.end].filter(Boolean).join(" – ")}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ editor */

type Tab = "VISUAL" | "LATEX"

/** onReplaced: the server made new content (refill, pick again), so the editor starts over from it. */
function ResumeEditor({ initial, onReplaced }: { initial: Resume; onReplaced: (r: Resume) => void }) {
  const [form, setForm] = useState<ResumeForm>(() => formFrom(initial))
  const [tab, setTab] = useState<Tab>(initial.mode)
  const [busy, setBusy] = useState<"" | "pdf" | "upload" | "retailor">("")
  const [pdfUrl, setPdfUrl] = useState(initial.pdfUrl)
  const pdfInput = useRef<HTMLInputElement>(null)
  const isTailored = initial.kind === "TAILORED"

  const [save, { loading: saving }] = useMutation<{ saveResume: Resume }>(SAVE_RESUME)
  const [setPdf] = useMutation(SET_RESUME_PDF)
  const [reset, { loading: resetting }] = useMutation<{ resetResumeFromPortfolio: Resume }>(RESET_RESUME_FROM_PORTFOLIO)
  const [tailor] = useMutation<{ tailorResumeForJob: Resume }>(TAILOR_RESUME_FOR_JOB)

  const set = (k: keyof ResumeForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setItem = <K extends "links" | "projects" | "experience" | "education">(k: K, i: number, patch: Partial<ResumeForm[K][number]>) =>
    setForm((f) => ({ ...f, [k]: (f[k] as unknown[]).map((x, j) => (j === i ? { ...(x as object), ...patch } : x)) }))
  const remove = (k: "links" | "projects" | "experience" | "education", i: number) =>
    setForm((f) => ({ ...f, [k]: (f[k] as unknown[]).filter((_, j) => j !== i) }))

  const persist = async (mode: ResumeMode = form.mode): Promise<Resume | null> => {
    try {
      const res = await save({ variables: { id: isTailored ? initial.id : null, input: inputFrom({ ...form, mode }) } })
      const saved = res.data!.saveResume
      setForm((f) => ({ ...f, mode }))
      setPdfUrl(saved.pdfUrl)
      return saved
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save")
      return null
    }
  }

  const makePdf = async () => {
    setBusy("pdf")
    try {
      const saved = await persist(form.mode)
      if (!saved) return
      const blob = await buildResumePdf(pdfDataFrom(saved))
      const url = await uploadResumePdf(blob, saved.fullName)
      await setPdf({ variables: { id: saved.id, pdfUrl: url } })
      setPdfUrl(url)
      toast.success(isTailored ? "PDF ready for this job." : "PDF ready. Your portfolio now links to it.")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't make the PDF")
    } finally {
      setBusy("")
    }
  }

  const uploadCompiled = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_PDF_BYTES) return toast.error("The PDF must be 5MB or smaller.")
    setBusy("upload")
    try {
      const saved = await persist("LATEX")
      if (!saved) return
      const url = await uploadResumePdf(file, saved.fullName)
      await setPdf({ variables: { id: saved.id, pdfUrl: url } })
      setPdfUrl(url)
      toast.success("PDF attached.")
    } catch (e) {
      toast.error((e as Error).message || "Upload failed")
    } finally {
      setBusy("")
      if (pdfInput.current) pdfInput.current.value = ""
    }
  }

  const retailor = async () => {
    if (!initial.jobId) return
    setBusy("retailor")
    try {
      const res = await tailor({ variables: { jobId: initial.jobId, refresh: true } })
      onReplaced(res.data!.tailorResumeForJob)
      toast.success("Projects picked again for this job.")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't pick projects")
    } finally {
      setBusy("")
    }
  }

  const latexSource = form.latex || initial.generatedLatex

  return (
    <div className="space-y-6">
      {isTailored && (
        <div className="bg-card space-y-2 rounded-xl border p-4 text-sm">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            <SparklesIcon className="size-4 text-(--brand-secondary)" />
            {initial.tailorSource === "AI" ? "Projects picked by AI for this job" : "Projects matched to this job by keywords"}
          </p>
          {initial.tailorNote && <p className="text-muted-foreground">{initial.tailorNote}</p>}
          {initial.outdated && <p className="text-amber-700 dark:text-amber-300">Your main CV changed after this copy was made.</p>}
          <Button type="button" size="sm" variant="outline" onClick={retailor} disabled={busy !== ""}>
            {busy === "retailor" ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />} Pick projects again
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(["VISUAL", "LATEX"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn("rounded-full border px-4 py-1.5 text-sm", tab === t ? "border-(--brand-secondary) bg-(--brand-secondary)/10 font-medium" : "text-muted-foreground")}
          >
            {t === "VISUAL" ? "Visual editor" : "LaTeX"}
          </button>
        ))}
        <label className="text-muted-foreground ml-auto flex items-center gap-2 text-sm">
          My PDF comes from
          <select
            className="border-input bg-background h-8 rounded-md border px-2 text-sm"
            value={form.mode}
            onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as ResumeMode }))}
          >
            <option value="VISUAL">the visual editor</option>
            <option value="LATEX">my LaTeX</option>
          </select>
        </label>
      </div>

      {tab === "VISUAL" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <Section title="About you">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <Input value={form.fullName} onChange={set("fullName")} maxLength={100} />
                </Field>
                <Field label="Headline">
                  <Input value={form.headline} onChange={set("headline")} maxLength={120} placeholder="Junior web developer" />
                </Field>
                <Field label="Email">
                  <Input value={form.email} onChange={set("email")} maxLength={200} />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={set("phone")} maxLength={40} />
                </Field>
                <Field label="City">
                  <Input value={form.location} onChange={set("location")} maxLength={80} />
                </Field>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input type="checkbox" checked={form.showPortfolioLink} onChange={(e) => setForm((f) => ({ ...f, showPortfolioLink: e.target.checked }))} />
                  Put my portfolio link on the CV
                </label>
              </div>
              <Field label="Summary" hint="2–3 sentences about what you do.">
                <Textarea value={form.summary} onChange={set("summary")} rows={4} maxLength={1500} />
              </Field>
              <Field label="Skills" hint="Separate with commas.">
                <Input value={form.skills} onChange={set("skills")} placeholder="React, Node.js, SQL" />
              </Field>
            </Section>

            <Section title="Links" onAdd={form.links.length < 8 ? () => setForm((f) => ({ ...f, links: [...f.links, { label: "", url: "" }] })) : undefined} addLabel="Add link">
              {form.links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={l.label} onChange={(e) => setItem("links", i, { label: e.target.value })} placeholder="GitHub" className="w-32" maxLength={40} />
                  <Input value={l.url} onChange={(e) => setItem("links", i, { url: e.target.value })} placeholder="https://" />
                  <RemoveButton onClick={() => remove("links", i)} />
                </div>
              ))}
            </Section>

            <Section
              title="Projects"
              hint={isTailored ? "Picked for this job. Remove or add any." : "Projects from your portfolio get a link to their place on your portfolio."}
              onAdd={form.projects.length < 10 ? () => setForm((f) => ({ ...f, projects: [...f.projects, { ...blankProject }] })) : undefined}
              addLabel="Add project"
            >
              {form.projects.map((p, i) => (
                <div key={i} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-start gap-2">
                    <Input value={p.title} onChange={(e) => setItem("projects", i, { title: e.target.value })} placeholder="Project name" maxLength={100} />
                    <RemoveButton onClick={() => remove("projects", i)} />
                  </div>
                  {p.reason && <p className="text-xs text-(--brand-secondary)">Why it fits: {p.reason}</p>}
                  {p.portfolioIndex != null && <p className="text-muted-foreground text-xs">From your portfolio (project {p.portfolioIndex + 1})</p>}
                  <Textarea value={p.description} onChange={(e) => setItem("projects", i, { description: e.target.value })} rows={2} maxLength={1000} placeholder="What it does" />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input value={p.url} onChange={(e) => setItem("projects", i, { url: e.target.value })} placeholder="Live link" />
                    <Input value={p.repoUrl} onChange={(e) => setItem("projects", i, { repoUrl: e.target.value })} placeholder="Code link" />
                    <Input value={p.tech} onChange={(e) => setItem("projects", i, { tech: e.target.value })} placeholder="Tech, comma separated" />
                  </div>
                </div>
              ))}
            </Section>

            <Section title="Experience" onAdd={form.experience.length < 10 ? () => setForm((f) => ({ ...f, experience: [...f.experience, { ...blankExperience }] })) : undefined} addLabel="Add">
              {form.experience.map((x, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="flex gap-2">
                    <Input value={x.role} onChange={(e) => setItem("experience", i, { role: e.target.value })} placeholder="Role" maxLength={100} />
                    <Input value={x.company} onChange={(e) => setItem("experience", i, { company: e.target.value })} placeholder="Company" maxLength={100} />
                    <RemoveButton onClick={() => remove("experience", i)} />
                  </div>
                  <div className="flex gap-2">
                    <Input value={x.start} onChange={(e) => setItem("experience", i, { start: e.target.value })} placeholder="From" maxLength={20} />
                    <Input value={x.end} onChange={(e) => setItem("experience", i, { end: e.target.value })} placeholder="To" maxLength={20} />
                  </div>
                  <Textarea value={x.description} onChange={(e) => setItem("experience", i, { description: e.target.value })} rows={2} maxLength={1000} />
                </div>
              ))}
            </Section>

            <Section title="Education" onAdd={form.education.length < 6 ? () => setForm((f) => ({ ...f, education: [...f.education, { ...blankEducation }] })) : undefined} addLabel="Add">
              {form.education.map((x, i) => (
                <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                  <Input value={x.degree} onChange={(e) => setItem("education", i, { degree: e.target.value })} placeholder="Degree or course" maxLength={120} />
                  <div className="flex gap-2">
                    <Input value={x.school} onChange={(e) => setItem("education", i, { school: e.target.value })} placeholder="School" maxLength={120} />
                    <RemoveButton onClick={() => remove("education", i)} />
                  </div>
                  <Input value={x.start} onChange={(e) => setItem("education", i, { start: e.target.value })} placeholder="From" maxLength={20} />
                  <Input value={x.end} onChange={(e) => setItem("education", i, { end: e.target.value })} placeholder="To" maxLength={20} />
                </div>
              ))}
            </Section>
          </div>
          <div className="xl:sticky xl:top-4 xl:self-start">
            <Preview form={form} portfolioUrl={initial.portfolioUrl} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card text-muted-foreground space-y-2 rounded-xl border p-4 text-sm">
            <p>
              Write your CV in LaTeX. To make the PDF, open it in Overleaf, compile, download the PDF and upload it here. Keep the{" "}
              <code className="text-foreground">% TECHON:SUMMARY</code> and <code className="text-foreground">% TECHON:PROJECTS</code> marker lines: when you
              apply for a job, the portal swaps the summary and projects between them for the ones that fit the job.
            </p>
            <p>When you apply, the portal can also make a PDF from your details automatically if you don&apos;t want to compile.</p>
          </div>
          <Textarea
            value={latexSource}
            onChange={(e) => setForm((f) => ({ ...f, latex: e.target.value }))}
            rows={28}
            spellCheck={false}
            maxLength={60000}
            className="font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setForm((f) => ({ ...f, latex: initial.generatedLatex }))}>
              <WandSparklesIcon className="size-4" /> Fill from my details
            </Button>
            <Button type="button" variant="outline" onClick={() => openInOverleaf(latexSource, `${form.fullName || "cv"}.tex`)}>
              <ExternalLinkIcon className="size-4" /> Open in Overleaf
            </Button>
            <Button type="button" variant="outline" onClick={() => downloadText(latexSource, "cv.tex")}>
              <DownloadIcon className="size-4" /> Download .tex
            </Button>
            <input ref={pdfInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => void uploadCompiled(e.target.files?.[0])} />
            <Button type="button" variant="outline" onClick={() => pdfInput.current?.click()} disabled={busy !== ""}>
              {busy === "upload" ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />} Upload compiled PDF
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            &quot;Fill from my details&quot; uses your last saved details from the visual editor. Overleaf is a separate website; it needs its own (free) account.
          </p>
        </div>
      )}

      <div className="bg-background/95 sticky bottom-0 z-10 flex flex-wrap items-center gap-2 border-t py-3">
        <Button type="button" variant="outline" disabled={saving || busy !== ""} onClick={() => void persist(form.mode).then((r) => r && toast.success("Saved."))}>
          {saving && busy === "" ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />} Save
        </Button>
        <Button type="button" variant="brand-secondary" disabled={saving || busy !== ""} onClick={() => void makePdf()}>
          {busy === "pdf" ? <Loader2Icon className="size-4 animate-spin" /> : <FileTextIcon className="size-4" />} Save &amp; make PDF
        </Button>
        {!isTailored && (
          <Button
            type="button"
            variant="ghost"
            disabled={resetting || busy !== ""}
            onClick={async () => {
              if (!window.confirm("Replace the CV's details with what's on your portfolio? Your LaTeX stays.")) return
              try {
                const res = await reset()
                onReplaced(res.data!.resetResumeFromPortfolio)
                toast.success("Filled from your portfolio.")
              } catch (e) {
                toast.error((e as Error).message || "Couldn't refill")
              }
            }}
          >
            <RefreshCwIcon className="size-4" /> Refill from portfolio
          </Button>
        )}
        {pdfUrl ? (
          <a href={pdfUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-(--brand-secondary)">
            <FileTextIcon className="size-4" /> Open PDF
          </a>
        ) : (
          <span className="text-muted-foreground ml-auto text-sm">No PDF yet</span>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ screen */

export function StudentResumeScreen({ jobId }: { jobId?: string }) {
  const base = useQuery<{ myResume: Resume }>(GET_MY_RESUME, { skip: !!jobId, fetchPolicy: "network-only" })
  const tailored = useQuery<{ myTailoredResume: Resume | null }>(GET_MY_TAILORED_RESUME, {
    variables: { jobId },
    skip: !jobId,
    fetchPolicy: "network-only",
  })
  // A newer copy from the server (refill, pick again) replaces the editor's state through its key.
  const [latest, setLatest] = useState<Resume | null>(null)
  const [version, setVersion] = useState(0)
  const loaded = jobId ? tailored.data?.myTailoredResume : base.data?.myResume
  const resume = latest && latest.id === loaded?.id ? latest : loaded
  const loading = jobId ? tailored.loading : base.loading

  if (loading && !resume) return <ContentAreaLoader />
  if (!resume) {
    return (
      <div className="w-full py-10">
        <EmptyState title="No CV for this job yet">
          <Link href={jobId ? jobPath(jobId) : CONFIG.ROUTES.STUDENT.JOBS} className="text-(--brand-secondary)">
            Open the job and press Apply to make one
          </Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-6">
        {jobId && (
          <Link href={CONFIG.ROUTES.STUDENT.RESUME} className="text-muted-foreground mb-3 inline-flex items-center gap-1 text-sm">
            <ArrowLeftIcon className="size-4" /> My main CV
          </Link>
        )}
        <div className="text-sm font-semibold text-secondary">{jobId ? "CV for one job" : "My CV"}</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {jobId && resume.job ? `${resume.job.title} at ${resume.job.companyName}` : "CV builder"}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          {jobId
            ? "This copy of your CV was made for this job. Changes here don't touch your main CV."
            : "Build your CV with the visual editor or in LaTeX. When you apply for a job, the portal makes a copy with the projects from your portfolio that fit the job."}
        </p>
      </div>
      <ResumeEditor
        key={`${resume.id}:${version}`}
        initial={resume}
        onReplaced={(r) => {
          setLatest(r)
          setVersion((v) => v + 1)
        }}
      />
    </div>
  )
}
