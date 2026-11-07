"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import { ArrowLeftIcon, Loader2Icon, LightbulbIcon } from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import { ANSWER_PRACTICE_QUESTION, GET_INTERVIEW_PRACTICE } from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { CONFIG } from "@/utils/constants"
import { EmptyState, jobPath } from "../jobs/shared"
import type { Practice, PracticeQuestion } from "./student"

const ANSWER_MAX = 3000

const SCORE_TEXT: Record<number, string> = { 1: "Needs work", 2: "Getting there", 3: "Good", 4: "Strong", 5: "Excellent" }
const scoreClass = (n: number) =>
  n >= 4
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : n === 3
      ? "bg-sky-500/15 text-sky-700 dark:text-sky-400"
      : "bg-amber-500/15 text-amber-700 dark:text-amber-400"

export function InterviewPracticeScreen({ id }: { id: string }) {
  const { data, loading } = useQuery<{ interviewPractice: Practice | null }>(GET_INTERVIEW_PRACTICE, { variables: { id } })
  const p = data?.interviewPractice
  const back = `${CONFIG.ROUTES.STUDENT.JOBS}?tab=practice`

  if (loading && !data) return <ContentAreaLoader />
  if (!p)
    return (
      <EmptyState title="Practice not found">
        <Link href={back} className="text-(--site-accent)">
          Back to your practice sessions
        </Link>
      </EmptyState>
    )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={back} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
          <ArrowLeftIcon className="size-4" /> Practice sessions
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Interview practice</h1>
        <p className="text-muted-foreground text-sm">
          <Link href={jobPath(p.jobId)} className="hover:text-foreground font-medium">
            {p.jobTitle}
          </Link>{" "}
          at {p.companyName} · {p.answeredCount} of {p.questions.length} answered
          {p.averageScore != null && ` · average ${p.averageScore.toFixed(1)} / 5`}
        </p>
      </div>
      <div className="bg-muted/40 rounded-xl p-4 text-sm">
        Answer out loud first, then write it down the way you said it. Use real examples from your projects: what you built, how, and
        what you learned.
        {p.aiAvailable ? (
          p.feedbackLeftToday > 0 ? (
            <span className="text-muted-foreground"> You can get {p.feedbackLeftToday} more detailed reviews today.</span>
          ) : (
            <span className="text-muted-foreground"> You&apos;ve used today&apos;s detailed reviews, so you&apos;ll get quick tips until tomorrow.</span>
          )
        ) : null}
      </div>
      <ol className="space-y-4">
        {p.questions.map((q, i) => (
          <QuestionCard key={i} practiceId={p.id} index={i} q={q} />
        ))}
      </ol>
    </div>
  )
}

function QuestionCard({ practiceId, index, q }: { practiceId: string; index: number; q: PracticeQuestion }) {
  const [answer, setAnswer] = useState(q.answer)
  const [editing, setEditing] = useState(!q.answeredAt)
  const [send, { loading }] = useMutation(ANSWER_PRACTICE_QUESTION)

  const submit = async () => {
    if (answer.trim().length < 5) return toast.error("Write your answer first")
    try {
      await send({ variables: { id: practiceId, index, answer: answer.trim() } })
      setEditing(false)
    } catch (e) {
      toast.error((e as Error).message || "Couldn't check your answer")
    }
  }

  return (
    <li className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Question {index + 1}
        {q.focus && ` · ${q.focus}`}
      </p>
      <p className="mt-1 font-medium">{q.question}</p>

      {editing ? (
        <div className="mt-3 space-y-2">
          <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={6} maxLength={ANSWER_MAX} placeholder="Your answer" />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={loading} onClick={() => void submit()}>
              {loading && <Loader2Icon className="size-4 animate-spin" />}
              {loading ? "Checking…" : "Get feedback"}
            </Button>
            {q.answeredAt && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAnswer(q.answer)
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
            )}
            <span className="text-muted-foreground ml-auto text-xs">
              {answer.length} / {ANSWER_MAX}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-line">{q.answer}</p>
          {q.score != null && (
            <div className="space-y-2">
              <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", scoreClass(q.score))}>
                {q.score} / 5 · {SCORE_TEXT[q.score] ?? ""}
              </span>
              {q.feedback && <p className="text-sm whitespace-pre-line">{q.feedback}</p>}
              {q.tip && (
                <p className="flex gap-2 text-sm">
                  <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <span>{q.tip}</span>
                </p>
              )}
              {q.feedbackSource === "TEMPLATE" && <p className="text-muted-foreground text-xs">Quick tips based on the length and shape of your answer.</p>}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Try again
          </Button>
        </div>
      )}
    </li>
  )
}
