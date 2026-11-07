"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useMutation } from "@apollo/client/react"
import { FileTextIcon, Loader2Icon, PencilIcon, RefreshCwIcon, SparklesIcon } from "lucide-react"
import toast from "react-hot-toast"

import { SET_RESUME_PDF, TAILOR_RESUME_FOR_JOB } from "@/lib/graphql"
import { cn } from "@/lib/helpers"
import { CONFIG } from "@/utils/constants"
import { buildResumePdf, pdfDataFrom, uploadResumePdf, type Resume } from "./shared"

export const resumeForJobPath = (jobId: string) => `${CONFIG.ROUTES.STUDENT.RESUME}?job=${encodeURIComponent(jobId)}`

/** Make (once) the CV for a job as soon as the student opens it. */
function useTailoredResume(jobId: string, auto: boolean) {
  const [tailor, { data, loading, error }] = useMutation<{ tailorResumeForJob: Resume }>(TAILOR_RESUME_FOR_JOB)
  useEffect(() => {
    if (auto) void tailor({ variables: { jobId } }).catch(() => undefined)
  }, [auto, jobId, tailor])
  return {
    resume: data?.tailorResumeForJob ?? null,
    loading,
    error,
    redo: () => tailor({ variables: { jobId, refresh: true } }),
    make: () => tailor({ variables: { jobId } }),
  }
}

/** Make sure the CV has a PDF; draws one from its details when it doesn't. Returns the link. */
export function useEnsureResumePdf() {
  const [setPdf] = useMutation(SET_RESUME_PDF)
  return async (resume: Resume): Promise<string> => {
    if (resume.pdfUrl) return resume.pdfUrl
    const blob = await buildResumePdf(pdfDataFrom(resume))
    const url = await uploadResumePdf(blob, resume.fullName)
    await setPdf({ variables: { id: resume.id, pdfUrl: url } })
    return url
  }
}

function ProjectsPicked({ resume }: { resume: Resume }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <SparklesIcon className="size-3.5 text-(--site-accent)" />
        {resume.tailorSource === "AI" ? "Projects picked by AI for this job" : "Projects matched to this job"}
      </p>
      {resume.projects.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No projects yet.{" "}
          <Link href={CONFIG.ROUTES.STUDENT.PORTFOLIO} className="underline">
            Add some to your portfolio
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-1.5">
          {resume.projects.map((p, i) => (
            <li key={i} className="text-xs">
              <span className="font-medium">{p.title}</span>
              {p.reason && <span className="text-muted-foreground"> – {p.reason}</span>}
            </li>
          ))}
        </ul>
      )}
      {resume.tailorNote && <p className="text-muted-foreground text-xs">{resume.tailorNote}</p>}
    </div>
  )
}

/**
 * Inside the Apply box: shows the CV made for this job and lets the student send it (the default),
 * or apply with just their usual CV and portfolio. Calls onApply with the CV id to send (or null).
 */
export function TailoredCvChoice({
  jobId,
  sending,
  onApply,
  buttonClass,
}: {
  jobId: string
  sending: boolean
  onApply: (resumeId: string | null) => Promise<void>
  buttonClass: string
}) {
  const { resume, loading, error, redo } = useTailoredResume(jobId, true)
  const ensurePdf = useEnsureResumePdf()
  const [useTailored, setUseTailored] = useState(true)
  const [preparing, setPreparing] = useState(false)
  const lockedToLatex = resume?.mode === "LATEX" && !resume.pdfUrl

  const submit = async () => {
    if (!useTailored || !resume) return onApply(null)
    setPreparing(true)
    try {
      await ensurePdf(resume)
    } catch (e) {
      setPreparing(false)
      return void toast.error((e as Error).message || "Couldn't make the PDF")
    }
    setPreparing(false)
    await onApply(resume.id)
  }

  return (
    <div className="space-y-3">
      <div className="bg-muted/40 space-y-3 rounded-lg border p-3">
        {loading && !resume ? (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Loader2Icon className="size-3.5 animate-spin" /> Making a CV for this job from your portfolio…
          </p>
        ) : resume ? (
          <>
            <ProjectsPicked resume={resume} />
            <div className="flex flex-wrap gap-3 text-xs">
              <Link href={resumeForJobPath(jobId)} className="inline-flex items-center gap-1 text-(--site-accent)">
                <PencilIcon className="size-3.5" /> Review or edit this CV
              </Link>
              <button type="button" className="text-muted-foreground inline-flex items-center gap-1" onClick={() => void redo()} disabled={loading}>
                <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin")} /> Pick again
              </button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">{error ? "Couldn't make a CV for this job. You can still apply with your portfolio." : null}</p>
        )}
      </div>

      {resume && (
        <div className="space-y-1.5 text-xs">
          <label className="flex items-start gap-2">
            <input type="radio" className="mt-0.5" checked={useTailored} onChange={() => setUseTailored(true)} />
            <span>
              Send the CV made for this job, with links to these projects and my portfolio
              {lockedToLatex && <span className="text-muted-foreground block">The PDF will be made in the portal&apos;s layout. To use your LaTeX layout, upload its PDF on the edit page first.</span>}
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" className="mt-0.5" checked={!useTailored} onChange={() => setUseTailored(false)} />
            <span>Send my usual CV and portfolio</span>
          </label>
        </div>
      )}

      <button type="button" className={cn(buttonClass, "w-full")} disabled={sending || preparing || (loading && !resume)} onClick={() => void submit()}>
        {(sending || preparing) && <Loader2Icon className="size-4 animate-spin" />}
        {preparing ? "Making the PDF…" : "Apply"}
      </button>
    </div>
  )
}

/** For jobs on other sites: make the CV for this job and open its PDF to download. */
export function TailorForExternalJob({ jobId, buttonClass }: { jobId: string; buttonClass: string }) {
  const { make } = useTailoredResume(jobId, false)
  const ensurePdf = useEnsureResumePdf()
  const [busy, setBusy] = useState(false)
  return (
    <div className="space-y-1">
      <button
        type="button"
        className={cn(buttonClass, "w-full")}
        disabled={busy}
        onClick={async () => {
          // Open the tab now so the browser doesn't block it as a pop-up.
          const tab = window.open("", "_blank")
          setBusy(true)
          try {
            const res = await make()
            const url = await ensurePdf(res.data!.tailorResumeForJob)
            if (tab) tab.location.href = url
            else window.location.href = url
            toast.success("Your CV for this job is ready.")
          } catch (e) {
            tab?.close()
            toast.error((e as Error).message || "Couldn't make the CV")
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? <Loader2Icon className="size-4 animate-spin" /> : <FileTextIcon className="size-4" />} Make my CV for this job
      </button>
      <p className="text-muted-foreground text-xs">
        Picks your portfolio projects that fit this job.{" "}
        <Link href={resumeForJobPath(jobId)} className="underline">
          Edit it
        </Link>
      </p>
    </div>
  )
}
