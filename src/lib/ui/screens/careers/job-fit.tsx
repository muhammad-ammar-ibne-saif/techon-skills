"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation } from "@apollo/client/react"
import { BookOpenIcon, CheckIcon, Loader2Icon, MessageSquareTextIcon, SparklesIcon } from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import { DRAFT_COVER_NOTE, START_INTERVIEW_PRACTICE } from "@/lib/graphql"
import { CONFIG } from "@/utils/constants"
import type { JobFit } from "../jobs/shared"

export const practicePath = (id: string) => `${CONFIG.ROUTES.STUDENT.INTERVIEW_PRACTICE}/${id}`

/** One line for job lists: how many of the job's skills the student has. */
export function FitSummary({ fit }: { fit: JobFit }) {
  if (!fit.total) return null
  return (
    <span className="text-muted-foreground text-xs">
      <span className="font-medium text-emerald-700 dark:text-emerald-400">
        You have {fit.matched.length} of {fit.total} skills
      </span>
      {fit.missing.length > 0 && <> · missing {fit.missing.slice(0, 4).join(", ")}</>}
      {fit.missing.length > 4 && "…"}
    </span>
  )
}

function Chip({ children, ok }: { children: string; ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
        ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "border-dashed"
      )}
    >
      {ok && <CheckIcon className="size-3" />}
      {children}
    </span>
  )
}

/** On the job page, for students: matched and missing skills, and our courses that teach the missing ones. */
export function JobFitBox({ fit, jobId, canPractise }: { fit: JobFit; jobId: string; canPractise: boolean }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">Your fit</h3>
        {fit.total ? (
          <p className="text-muted-foreground text-sm">
            You have {fit.matched.length} of the {fit.total} skills this job asks for.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">This job doesn&apos;t list skills we can match.</p>
        )}
      </div>
      {fit.total > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {fit.matched.map((s) => (
            <Chip key={s} ok>
              {s}
            </Chip>
          ))}
          {fit.missing.map((s) => (
            <Chip key={s} ok={false}>
              {s}
            </Chip>
          ))}
        </div>
      )}
      {fit.missing.length > 0 && fit.matched.length === 0 && (
        <p className="text-muted-foreground text-xs">
          Add your skills and project tech to your{" "}
          <Link href={CONFIG.ROUTES.STUDENT.PORTFOLIO} className="underline">
            portfolio
          </Link>{" "}
          so we can match them.
        </p>
      )}
      {!!fit.courses?.length && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Learn the missing skills</p>
          <ul className="space-y-2">
            {fit.courses.map((c) => (
              <li key={c.id} className="text-sm">
                <Link href={`${CONFIG.ROUTES.PUBLIC.COURSES}/${c.slug}`} className="inline-flex items-start gap-1.5 font-medium text-(--site-accent)">
                  <BookOpenIcon className="mt-0.5 size-4 shrink-0" />
                  {c.title}
                </Link>
                <span className="text-muted-foreground block pl-5.5 text-xs">
                  Teaches {c.teaches.join(", ")}
                  {c.enrolled && " · you're on this course"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {canPractise && <PractiseButton jobId={jobId} />}
    </div>
  )
}

export function PractiseButton({ jobId, className }: { jobId: string; className?: string }) {
  const router = useRouter()
  const [start, { loading }] = useMutation<{ startInterviewPractice: { id: string } }>(START_INTERVIEW_PRACTICE, {
    refetchQueries: ["GetMyInterviewPractices"],
  })
  const go = async () => {
    try {
      const res = await start({ variables: { jobId } })
      const id = res.data?.startInterviewPractice.id
      if (id) router.push(practicePath(id))
    } catch (e) {
      toast.error((e as Error).message || "Couldn't start the practice")
    }
  }
  return (
    <button
      type="button"
      onClick={() => void go()}
      disabled={loading}
      className={cn(
        "hover:bg-muted inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-60",
        className
      )}
    >
      {loading ? <Loader2Icon className="size-4 animate-spin" /> : <MessageSquareTextIcon className="size-4" />}
      Practise the interview
    </button>
  )
}

/** Fills the Apply box note with a draft. The student edits it before sending. */
export function CoverNoteButton({ jobId, hasText, onDraft }: { jobId: string; hasText: boolean; onDraft: (text: string) => void }) {
  const [draft, { loading }] = useMutation<{ draftCoverNote: { text: string; source: string; aiCallsLeftToday: number } }>(DRAFT_COVER_NOTE)
  const go = async () => {
    if (hasText && !window.confirm("Replace what you wrote with a new draft?")) return
    try {
      const res = await draft({ variables: { jobId } })
      const d = res.data?.draftCoverNote
      if (!d) return
      onDraft(d.text)
      toast.success(d.source === "AI" ? "Draft written. Read it and make it yours." : "Here's a starting point. Make it yours.")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't write a draft")
    }
  }
  return (
    <button
      type="button"
      onClick={() => void go()}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs font-medium text-(--site-accent) disabled:opacity-60"
    >
      {loading ? <Loader2Icon className="size-3.5 animate-spin" /> : <SparklesIcon className="size-3.5" />}
      Write it for me
    </button>
  )
}
