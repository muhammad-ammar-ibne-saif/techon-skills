"use client"

import { useMemo, useState } from "react"
import { useMutation } from "@apollo/client/react"
import { ClipboardCheckIcon, Loader2Icon, UserIcon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { UPDATE_SUBMISSION_MARKS, SET_SUBMISSION_RESUBMIT_ALLOWED } from "@/lib/graphql"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { formatDateLong } from "@/lib/helpers"
import { cn } from "@/lib/helpers"

const MCQ_MARKS_PER_QUESTION = 2
/** Show "allow resubmit" when marks are strictly below this fraction of max (matches API). */
export const RESUBMIT_THRESHOLD = 0.4

export type ShortAnswer = {
  questionId: number
  questionText: string
  answer: string
  maxMarks: number | null
  marksAwarded: number | null
}

export type SubmissionRow = {
  id: string
  userId: string
  courseId: string
  type: string
  referenceId: string
  title: string
  mcqScore: number | null
  mcqMax: number | null
  mcqCount: number | null
  shortAnswers: ShortAnswer[]
  marks: number | null
  maxMarks: number
  status: string
  markedAt: string | null
  /** Note to the student. */
  feedback?: string
  /** Staff-only marking guide of the assignment. */
  markingGuide?: string | null
  createdAt: string
  resubmitAllowed: boolean
  passingGrade: boolean
  canStudentSubmit: boolean
  attachmentUrl?: string | null
  attachmentUrls?: string[]
  user?: { id: string; email: string; fullName: string | null } | null
}

function computeMcqBandMarks(s: SubmissionRow): number {
  const count = s.mcqCount ?? 0
  const pool = count * MCQ_MARKS_PER_QUESTION
  const score = s.mcqScore ?? 0
  const max = s.mcqMax ?? 0
  if (pool <= 0 || max <= 0) return 0
  return Math.round((score / max) * pool)
}

function shortAnswerCap(sa: ShortAnswer, submission: SubmissionRow): number {
  if (sa.maxMarks != null && sa.maxMarks > 0) return sa.maxMarks
  const count = submission.shortAnswers.length
  if (count <= 0) return 0
  const mcqPool = (submission.mcqCount ?? 0) * MCQ_MARKS_PER_QUESTION
  return Math.floor((submission.maxMarks - mcqPool) / count)
}

type MarkModalState =
  | { mode: "assignment"; submission: SubmissionRow; marksInput: string; allowResubmit: boolean; feedback: string }
  | { mode: "graded"; submission: SubmissionRow; perQuestion: Record<number, string>; feedback: string }

const MAX_FEEDBACK = 3000

function MarkingGuideBox({ guide }: { guide?: string | null }) {
  if (!guide) return null
  return (
    <div className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm">
      <div className="mb-1 font-medium">Marking guide</div>
      <p className="whitespace-pre-wrap text-muted-foreground">{guide}</p>
    </div>
  )
}

function MarkingExtras({ feedback, onFeedback }: { feedback: string; onFeedback: (v: string) => void }) {
  return (
    <div className="mt-4">
      <label className="text-muted-foreground mb-1 block text-xs font-medium">
        Feedback for the student (optional). It is shown with the marks and sent in the email.
      </label>
      <Textarea
        value={feedback}
        onChange={(e) => onFeedback(e.target.value)}
        maxLength={MAX_FEEDBACK}
        placeholder="What was good, and what to improve next time."
        className="min-h-[80px] resize-y"
      />
    </div>
  )
}

type SubmissionGradingBlockProps = {
  submissions: SubmissionRow[]
  loading: boolean
  emptyMessage: string
  refetch: () => void | Promise<unknown>
}

export function SubmissionGradingBlock({ submissions, loading, emptyMessage, refetch }: SubmissionGradingBlockProps) {
  const [markModal, setMarkModal] = useState<MarkModalState | null>(null)
  /** Saved in this visit, so "next" skips them before the list reloads. */
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<"pending" | "all" | null>(null)

  const [updateMarks, { loading: updating }] = useMutation(UPDATE_SUBMISSION_MARKS)

  const waiting = submissions.filter((s) => s.status === "submitted" && !savedIds.includes(s.id))
  const pendingCount = submissions.filter((s) => s.status === "submitted").length
  const view = filter ?? (pendingCount > 0 ? "pending" : "all")
  const visible = view === "pending" ? submissions.filter((s) => s.status === "submitted") : submissions
  const nextAfterCurrent = markModal ? waiting.find((s) => s.id !== markModal.submission.id) ?? null : null
  const pendingLeft = markModal ? waiting.filter((s) => s.id !== markModal.submission.id).length + 1 : 0

  const [setResubmitAllowed, { loading: togglingResubmit }] = useMutation(SET_SUBMISSION_RESUBMIT_ALLOWED, {
    onCompleted: () => {
      toast.success("Resubmit setting updated.")
      void refetch()
    },
    onError: (e) => toast.error(e.message ?? "Could not update resubmit permission."),
  })

  const openMarkModal = (s: SubmissionRow) => {
    if (s.type === "graded_exercise") {
      const perQuestion: Record<number, string> = {}
      for (const sa of s.shortAnswers) {
        if (shortAnswerCap(sa, s) > 0) {
          perQuestion[sa.questionId] = sa.marksAwarded != null ? String(sa.marksAwarded) : ""
        }
      }
      setMarkModal({ mode: "graded", submission: s, perQuestion, feedback: s.feedback ?? "" })
    } else {
      setMarkModal({
        mode: "assignment",
        submission: s,
        marksInput: s.marks != null ? String(s.marks) : "",
        allowResubmit: false,
        feedback: s.feedback ?? "",
      })
    }
  }

  const gradedPreview = useMemo(() => {
    if (!markModal || markModal.mode !== "graded") return null
    const s = markModal.submission
    const mcqPart = computeMcqBandMarks(s)
    const mcqPool = (s.mcqCount ?? 0) * MCQ_MARKS_PER_QUESTION
    let shortSum = 0
    for (const sa of s.shortAnswers) {
      if (shortAnswerCap(sa, s) <= 0) continue
      const raw = markModal.perQuestion[sa.questionId] ?? ""
      const n = parseInt(raw, 10)
      if (!Number.isNaN(n)) shortSum += n
    }
    const total = mcqPart + shortSum
    const pct = s.maxMarks > 0 ? Math.round((total / s.maxMarks) * 100) : 0
    return { mcqPart, mcqPool, shortSum, total, pct }
  }, [markModal])

  const assignmentBelowThreshold = (() => {
    if (!markModal || markModal.mode !== "assignment") return false
    const maxM = markModal.submission.maxMarks
    const num = parseInt(markModal.marksInput, 10)
    if (Number.isNaN(num) || maxM <= 0) return false
    return num < maxM * RESUBMIT_THRESHOLD
  })()

  const save = async (input: Record<string, unknown>, goNext: boolean) => {
    if (!markModal) return
    const current = markModal.submission
    try {
      await updateMarks({ variables: { input: { ...input, feedback: markModal.feedback.trim() } } })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save marks.")
      return
    }
    setSavedIds((prev) => [...prev, current.id])
    void refetch()
    const next = goNext ? waiting.find((s) => s.id !== current.id) : undefined
    if (next) {
      toast.success("Saved. Next submission opened.")
      openMarkModal(next)
    } else {
      setMarkModal(null)
      toast.success(goNext ? "Saved. Nothing else is waiting for marks." : "Marks saved. Student will be notified.")
    }
  }

  const handleMarkSubmit = async (goNext: boolean) => {
    if (!markModal) return
    if (markModal.mode === "assignment") {
      const num = parseInt(markModal.marksInput, 10)
      if (markModal.marksInput.trim() === "" || Number.isNaN(num)) {
        toast.error(`Enter marks between 0 and ${markModal.submission.maxMarks}`)
        return
      }
      if (num < 0 || num > markModal.submission.maxMarks) {
        toast.error(`Marks must be between 0 and ${markModal.submission.maxMarks}`)
        return
      }
      const maxM = markModal.submission.maxMarks
      const below = maxM > 0 && num < maxM * RESUBMIT_THRESHOLD
      await save({ id: markModal.submission.id, marks: num, ...(below ? { allowResubmit: markModal.allowResubmit } : {}) }, goNext)
      return
    }
    const { submission, perQuestion } = markModal
    const shortAnswerMarks: { questionId: number; marks: number }[] = []
    for (const sa of submission.shortAnswers) {
      const cap = shortAnswerCap(sa, submission)
      if (cap <= 0) continue
      const raw = perQuestion[sa.questionId] ?? ""
      if (raw.trim() === "") {
        toast.error(`Enter marks for every short-answer question (0–${cap})`)
        return
      }
      const n = parseInt(raw, 10)
      if (Number.isNaN(n) || n < 0 || n > cap) {
        toast.error(`Marks must be between 0 and ${cap}`)
        return
      }
      shortAnswerMarks.push({ questionId: sa.questionId, marks: n })
    }
    if (shortAnswerMarks.length === 0) {
      toast.error("No short-answer questions to grade")
      return
    }
    await save({ id: submission.id, shortAnswerMarks }, goNext)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin" />
        <span>Loading submissions…</span>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <Card className="bg-background/70 backdrop-blur rounded-3xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ClipboardCheckIcon className="size-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        {(
          [
            ["pending", `Waiting for marks (${pendingCount})`],
            ["all", `All (${submissions.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3 py-1",
              view === key ? "border-(--brand-secondary) bg-(--brand-secondary)/10 font-medium" : "text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
        {waiting.length > 0 ? (
          <Button type="button" size="sm" shape="pill" variant="brand-secondary" onClick={() => openMarkModal(waiting[0])}>
            Start grading
          </Button>
        ) : null}
      </div>
      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
          Nothing is waiting for marks. Choose &quot;All&quot; to see marked work.
        </p>
      ) : (
      <Card className="bg-background/70 backdrop-blur rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted-surface/40">
                <tr>
                  <th className="p-4 font-semibold">Student</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">MCQ score</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Marks</th>
                  <th className="p-4 font-semibold">Submitted</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.id} className="border-b transition-colors hover:bg-muted-surface/20">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="size-4 text-muted-foreground" />
                        <span>{s.user?.fullName || s.user?.email || s.userId}</span>
                      </div>
                    </td>
                    <td className="p-4 capitalize">{s.type.replace("_", " ")}</td>
                    <td className="p-4 font-medium">{s.title}</td>
                    <td className="p-4">
                      {s.mcqMax != null && s.mcqMax > 0 ? `${s.mcqScore ?? 0}%` : "—"}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          s.status === "marked"
                            ? "bg-green-500/20 text-green-600 dark:text-green-400"
                            : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {s.status === "marked" ? "Marked" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4">
                      {s.status === "marked" ? `${s.marks ?? 0} / ${s.maxMarks}` : "—"}
                    </td>
                    <td className="p-4 text-muted-foreground">{formatDateLong(s.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {s.status === "submitted" ? (
                          <Button
                            type="button"
                            variant="brand-secondary"
                            size="sm"
                            shape="pill"
                            onClick={() => openMarkModal(s)}
                          >
                            Award marks
                          </Button>
                        ) : null}
                        {s.status === "marked" ? (
                          <Button type="button" variant="ghost" size="sm" shape="pill" onClick={() => openMarkModal(s)}>
                            Edit
                          </Button>
                        ) : null}
                        {s.status === "marked" && !s.passingGrade ? (
                          <Button
                            type="button"
                            variant={s.resubmitAllowed ? "outline" : "secondary"}
                            size="sm"
                            shape="pill"
                            disabled={togglingResubmit}
                            onClick={() =>
                              setResubmitAllowed({
                                variables: { id: s.id, allowed: !s.resubmitAllowed },
                              })
                            }
                          >
                            {s.resubmitAllowed ? "Revoke resubmit" : "Allow resubmit"}
                          </Button>
                        ) : null}
                        {s.status === "marked" && s.passingGrade ? (
                          <span className="text-muted-foreground text-xs">Pass — no resubmit</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      <DialogPrimitive.Root open={!!markModal} onOpenChange={(open) => !open && setMarkModal(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[min(88vh,calc(100vh-2rem))] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl outline-none">
            {markModal?.mode === "assignment" && (
              <>
                <DialogPrimitive.Title className="text-lg font-semibold">
                  Award marks: {markModal.submission.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">
                  Assignment — enter the total marks for this submission (max {markModal.submission.maxMarks}). If marks are
                  below {Math.round(RESUBMIT_THRESHOLD * 100)}% of the maximum, you can allow the student to submit again.
                </DialogPrimitive.Description>
                {(() => {
                  const urls =
                    markModal.submission.attachmentUrls?.length
                      ? markModal.submission.attachmentUrls
                      : markModal.submission.attachmentUrl
                        ? [markModal.submission.attachmentUrl]
                        : []
                  return urls.length > 0 ? (
                    <div className="mt-4 rounded-lg border bg-muted-surface/30 p-3 text-sm">
                      <div className="font-medium mb-2">Submitted files</div>
                      <ul className="space-y-1">
                        {urls.map((u, i) => (
                          <li key={u}>
                            <a href={u} target="_blank" rel="noreferrer" className="text-(--brand-secondary) text-xs underline break-all">
                              File {i + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                })()}
                <MarkingGuideBox guide={markModal.submission.markingGuide} />
                {markModal.submission.shortAnswers.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border bg-muted-surface/30 p-3 text-sm">
                    <div className="font-medium mb-2">Student content</div>
                    {markModal.submission.shortAnswers.map((sa) => (
                      <div key={sa.questionId} className="mb-3">
                        <p className="text-muted-foreground text-xs">{sa.questionText}</p>
                        <p className="mt-1">{sa.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Total marks (0 – {markModal.submission.maxMarks})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={markModal.submission.maxMarks}
                    value={markModal.marksInput}
                    onChange={(e) =>
                      setMarkModal((prev) =>
                        prev?.mode === "assignment" ? { ...prev, marksInput: e.target.value } : prev
                      )
                    }
                    className="w-28"
                  />
                </div>
                {assignmentBelowThreshold ? (
                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 rounded border-input"
                      checked={markModal.allowResubmit}
                      onChange={(e) =>
                        setMarkModal((prev) =>
                          prev?.mode === "assignment" ? { ...prev, allowResubmit: e.target.checked } : prev
                        )
                      }
                    />
                    <span>
                      <span className="font-medium text-amber-900 dark:text-amber-200">Allow student to submit again</span>
                      <span className="text-muted-foreground block text-xs">
                        Off by default. Turn on only if this student should upload a new attempt.
                      </span>
                    </span>
                  </label>
                ) : null}
                <MarkingExtras
                  feedback={markModal.feedback}
                  onFeedback={(feedback) => setMarkModal((prev) => (prev ? { ...prev, feedback } : prev))}
                />
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <DialogPrimitive.Close asChild>
                    <Button type="button" variant="outline" shape="pill">
                      Cancel
                    </Button>
                  </DialogPrimitive.Close>
                  <Button
                    type="button"
                    variant={nextAfterCurrent ? "outline" : "brand-secondary"}
                    shape="pill"
                    disabled={updating}
                    onClick={() => void handleMarkSubmit(false)}
                  >
                    {updating ? <Loader2Icon className="size-4 animate-spin" /> : "Save marks"}
                  </Button>
                  {nextAfterCurrent ? (
                    <Button
                      type="button"
                      variant="brand-secondary"
                      shape="pill"
                      disabled={updating}
                      onClick={() => void handleMarkSubmit(true)}
                    >
                      Save &amp; next ({pendingLeft - 1} left)
                    </Button>
                  ) : null}
                </div>
              </>
            )}

            {markModal?.mode === "graded" && gradedPreview && (
              <>
                <DialogPrimitive.Title className="text-lg font-semibold">
                  Award marks: {markModal.submission.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">
                  Graded exercise — MCQ band is fixed at {MCQ_MARKS_PER_QUESTION} marks per question ({markModal.submission.mcqCount ?? 0}{" "}
                  MCQs → max {gradedPreview.mcqPool} marks from MCQs). It is calculated from the student&apos;s MCQ performance and
                  cannot be edited here.
                </DialogPrimitive.Description>

                <div className="mt-4 rounded-lg border bg-muted-surface/30 px-3 py-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">MCQ performance</span>
                    <span>
                      {markModal.submission.mcqMax != null && markModal.submission.mcqMax > 0
                        ? `${markModal.submission.mcqScore ?? 0}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between gap-2 font-medium">
                    <span>MCQ marks (auto)</span>
                    <span>
                      {gradedPreview.mcqPart} / {gradedPreview.mcqPool}
                    </span>
                  </div>
                </div>

                {markModal.submission.shortAnswers.some((sa) => shortAnswerCap(sa, markModal.submission) > 0) && (
                  <div className="mt-4 space-y-4">
                    <div className="font-medium text-sm">Short answers</div>
                    {markModal.submission.shortAnswers.map((sa) => {
                      const cap = shortAnswerCap(sa, markModal.submission)
                      if (cap <= 0) return null
                      return (
                        <div key={sa.questionId} className="rounded-lg border bg-muted-surface/20 p-3">
                          <p className="text-muted-foreground text-xs line-clamp-2">{sa.questionText}</p>
                          <p className="mt-2 text-sm">{sa.answer}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <label className="text-muted-foreground text-xs whitespace-nowrap">Marks (0–{cap})</label>
                            <Input
                              type="number"
                              min={0}
                              max={cap}
                              value={markModal.perQuestion[sa.questionId] ?? ""}
                              onChange={(e) =>
                                setMarkModal((prev) => {
                                  if (!prev || prev.mode !== "graded") return prev
                                  return {
                                    ...prev,
                                    perQuestion: { ...prev.perQuestion, [sa.questionId]: e.target.value },
                                  }
                                })
                              }
                              className="w-24"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-6 rounded-xl border-2 border-(--brand-secondary)/30 bg-(--brand-secondary)/5 px-4 py-3 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>
                      {gradedPreview.total} / {markModal.submission.maxMarks}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 flex justify-between">
                    <span>Overall</span>
                    <span>{gradedPreview.pct}%</span>
                  </div>
                </div>

                <MarkingExtras
                  feedback={markModal.feedback}
                  onFeedback={(feedback) => setMarkModal((prev) => (prev ? { ...prev, feedback } : prev))}
                />
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <DialogPrimitive.Close asChild>
                    <Button type="button" variant="outline" shape="pill">
                      Cancel
                    </Button>
                  </DialogPrimitive.Close>
                  <Button
                    type="button"
                    variant={nextAfterCurrent ? "outline" : "brand-secondary"}
                    shape="pill"
                    disabled={updating}
                    onClick={() => void handleMarkSubmit(false)}
                  >
                    {updating ? <Loader2Icon className="size-4 animate-spin" /> : "Save marks"}
                  </Button>
                  {nextAfterCurrent ? (
                    <Button
                      type="button"
                      variant="brand-secondary"
                      shape="pill"
                      disabled={updating}
                      onClick={() => void handleMarkSubmit(true)}
                    >
                      Save &amp; next ({pendingLeft - 1} left)
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
