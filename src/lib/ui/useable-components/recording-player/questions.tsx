"use client"

import { useState, type RefObject } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import toast from "react-hot-toast"
import { CheckCircle2Icon, ClockIcon, Loader2Icon, MessageCircleQuestionIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import {
  ANSWER_QUESTION,
  ASK_QUESTION,
  DELETE_ANSWER,
  DELETE_QUESTION,
  GET_RECORDING_QUESTIONS,
  SET_QUESTION_RESOLVED,
} from "@/lib/graphql"
import { useUser } from "@/lib/providers/user"
import { UserRole } from "@/utils/enums/user"
import { formatClock } from "./clock"

const MAX_LENGTH = 2000

type Person = { id: string; name: string; isStaff: boolean }
export type QuestionItem = {
  id: string
  courseId: string
  courseTitle: string | null
  recordingId: string
  recordingTitle: string | null
  body: string
  atSeconds: number | null
  mine: boolean
  resolved: boolean
  answeredByStaff: boolean
  createdAt: string
  author: Person
  answers: { id: string; body: string; isStaff: boolean; mine: boolean; createdAt: string; author: Person }[]
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.")

export const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 30 * 86400) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

function Name({ person }: { person: Person }) {
  return (
    <span className="font-semibold">
      {person.name}
      {person.isStaff && (
        <span className="ml-1.5 rounded-full bg-(--brand-primary)/10 px-1.5 py-0.5 text-[10px] font-semibold text-(--brand-primary)">
          Instructor
        </span>
      )}
    </span>
  )
}

/** One question with its answers, a reply box and the asker's/staff actions. */
export function QuestionCard({
  q,
  canModerate,
  onSeek,
  onDeleted,
}: {
  q: QuestionItem
  canModerate: boolean
  onSeek?: (seconds: number) => void
  onDeleted?: () => void
}) {
  const [reply, setReply] = useState("")
  const [replying, setReplying] = useState(false)
  const [answer, { loading: answering }] = useMutation(ANSWER_QUESTION)
  const [setResolved, { loading: resolving }] = useMutation(SET_QUESTION_RESOLVED)
  const [deleteQuestion] = useMutation(DELETE_QUESTION)
  const [deleteAnswer] = useMutation(DELETE_ANSWER)

  const send = async () => {
    try {
      await answer({ variables: { questionId: q.id, body: reply.trim() } })
      setReply("")
      setReplying(false)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className={`rounded-xl border p-3 text-sm ${q.resolved ? "opacity-80" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <Name person={q.author} />
        <span className="text-muted-foreground">{timeAgo(q.createdAt)}</span>
        {q.atSeconds != null && (
          <button
            type="button"
            disabled={!onSeek}
            onClick={() => onSeek?.(q.atSeconds!)}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium text-(--brand-primary) enabled:hover:bg-(--brand-primary)/10"
          >
            <ClockIcon className="size-3" /> {formatClock(q.atSeconds)}
          </button>
        )}
        {q.resolved && (
          <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-3.5" /> Resolved
          </span>
        )}
      </div>
      <p className="mt-1.5 whitespace-pre-wrap break-words">{q.body}</p>

      {q.answers.length > 0 && (
        <ul className="mt-3 space-y-2 border-l-2 pl-3">
          {q.answers.map((a) => (
            <li key={a.id} className={a.isStaff ? "rounded-lg bg-(--brand-primary)/5 p-2" : ""}>
              <div className="flex items-center gap-2 text-xs">
                <Name person={a.author} />
                <span className="text-muted-foreground">{timeAgo(a.createdAt)}</span>
                {(a.mine || canModerate) && (
                  <button
                    type="button"
                    aria-label="Delete answer"
                    className="text-muted-foreground hover:text-destructive ml-auto"
                    onClick={() =>
                      deleteAnswer({ variables: { questionId: q.id, answerId: a.id } }).catch((e) => toast.error(errorMessage(e)))
                    }
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words">{a.body}</p>
            </li>
          ))}
        </ul>
      )}

      {replying ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={2}
            placeholder="Write an answer…"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button size="xs" variant="ghost" onClick={() => setReplying(false)}>
              Cancel
            </Button>
            <Button size="xs" disabled={!reply.trim() || answering} onClick={() => void send()}>
              {answering && <Loader2Icon className="size-3.5 animate-spin" />} Answer
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          <Button size="xs" variant="ghost" onClick={() => setReplying(true)}>
            Answer
          </Button>
          {(q.mine || canModerate) && (
            <>
              <Button
                size="xs"
                variant="ghost"
                disabled={resolving}
                onClick={() =>
                  setResolved({ variables: { questionId: q.id, resolved: !q.resolved } }).catch((e) => toast.error(errorMessage(e)))
                }
              >
                {q.resolved ? "Reopen" : "Mark resolved"}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                className="text-destructive"
                onClick={async () => {
                  if (!window.confirm("Delete this question?")) return
                  try {
                    await deleteQuestion({ variables: { questionId: q.id } })
                    onDeleted?.()
                  } catch (e) {
                    toast.error(errorMessage(e))
                  }
                }}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Questions and answers under a recording, shown below the video. */
export function RecordingQuestions({ recordingId, videoRef }: { recordingId: string; videoRef: RefObject<HTMLVideoElement | null> }) {
  const { userProfileInfo } = useUser()
  const role = userProfileInfo?.role
  const canModerate = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.INSTRUCTOR
  const { data, loading, error, refetch } = useQuery<{ getRecordingQuestions: QuestionItem[] }>(GET_RECORDING_QUESTIONS, {
    variables: { recordingId },
    fetchPolicy: "cache-and-network",
  })
  const [ask, { loading: asking }] = useMutation(ASK_QUESTION)
  const [body, setBody] = useState("")
  const [atNow, setAtNow] = useState(true)
  const questions = data?.getRecordingQuestions ?? []

  const submit = async () => {
    const v = videoRef.current
    const atSeconds = atNow && v && v.currentTime > 0 ? v.currentTime : null
    try {
      await ask({ variables: { recordingId, body: body.trim(), atSeconds } })
      setBody("")
      await refetch()
      toast.success("Question posted. You'll be notified when it's answered.")
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const seek = (seconds: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = seconds
    void v.play().catch(() => undefined)
    v.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <section className="bg-background space-y-4 px-4 py-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MessageCircleQuestionIcon className="size-4" /> Questions &amp; answers
        {questions.length > 0 && <span className="text-muted-foreground font-normal">({questions.length})</span>}
      </h3>

      <div className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={2}
          placeholder="Stuck on something in this lecture? Ask here — your instructor and classmates can answer."
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-muted-foreground flex items-center gap-2 text-xs">
            <input type="checkbox" checked={atNow} onChange={(e) => setAtNow(e.target.checked)} />
            Link to the current moment in the video
          </label>
          <Button size="sm" disabled={!body.trim() || asking} onClick={() => void submit()}>
            {asking && <Loader2Icon className="size-4 animate-spin" />} Ask question
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2Icon className="size-4 animate-spin" /> Loading questions…
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : questions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No questions yet. Be the first to ask.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} q={q} canModerate={canModerate} onSeek={seek} onDeleted={() => void refetch()} />
          ))}
        </div>
      )}
    </section>
  )
}
