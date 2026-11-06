"use client"

import Link from "next/link"
import { useId, useRef, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { ArrowLeftIcon, FileTextIcon, Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/useable-components/card"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import {
  CREATE_SUBMISSION,
  GET_COURSE_ASSIGNMENT_FOR_STUDENT,
  GET_MY_SUBMISSIONS,
  GET_SUBMISSION_BY_REFERENCE,
} from "@/lib/graphql"
import { apiService } from "@/lib/services"
import { formatDateLong } from "@/lib/helpers"
import { cn } from "@/lib/helpers"
import { useUser } from "@/lib/providers/user"

const MAX_TOTAL_BYTES = 5 * 1024 * 1024
const ACCEPT = "image/*,.pdf,application/pdf"

type PendingItem = { id: string; file: File; objectUrl: string }

function isImageFile(f: File) {
  return f.type.startsWith("image/")
}

function isPdfFile(f: File) {
  return f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
}

function urlLooksLikeImage(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url) || url.includes("/image")
}

export const StudentAssignmentDetailScreen = ({ assignmentId }: { assignmentId: string }) => {
  const { userProfileInfo } = useUser()
  const userId = userProfileInfo?.id ?? ""
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingId = useId()
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])

  const { data: assignData, loading: loadingA } = useQuery<{
    getCourseAssignmentForStudent: {
      id: string
      courseId: string
      title: string
      description: string | null
      guidelines: string | null
      attachmentUrls: string[]
      maxMarks: number
      referenceId: string
      dueDate: string | null
      course?: { title: string } | null
    } | null
  }>(GET_COURSE_ASSIGNMENT_FOR_STUDENT, {
    variables: { id: assignmentId },
    skip: !assignmentId || !userId,
    fetchPolicy: "network-only",
  })

  const a = assignData?.getCourseAssignmentForStudent
  const { data: subData } = useQuery<{
    getSubmissionByReference: {
      id: string
      status: string
      marks: number | null
      maxMarks: number
      feedback: string
      passingGrade: boolean
      canStudentSubmit: boolean
      attachmentUrl: string | null
      attachmentUrls: string[]
      shortAnswers: { answer: string }[]
    } | null
  }>(GET_SUBMISSION_BY_REFERENCE, {
    variables: {
      userId,
      courseId: a?.courseId ?? "",
      type: "assignment",
      referenceId: a?.referenceId ?? "",
    },
    skip: !userId || !a?.courseId || !a?.referenceId,
    fetchPolicy: "network-only",
  })

  const [createSubmission, { loading: submitting }] = useMutation(CREATE_SUBMISSION, {
    onCompleted: () => {
      toast.success("Submitted successfully.")
      setPendingItems((prev) => {
        prev.forEach((i) => URL.revokeObjectURL(i.objectUrl))
        return []
      })
    },
    onError: (e) => toast.error(e.message ?? "Submission failed"),
  })

  const sub = subData?.getSubmissionByReference ?? null
  const canUpload = !sub || sub.canStudentSubmit
  const pendingReview = sub?.status === "submitted"
  const graded = sub?.status === "marked"
  const hasSubmissionRecord = Boolean(sub)

  const submittedUrls = (() => {
    const urls = sub?.attachmentUrls?.length ? sub.attachmentUrls : sub?.attachmentUrl ? [sub.attachmentUrl] : []
    return urls.filter(Boolean)
  })()

  const totalPendingBytes = pendingItems.reduce((s, i) => s + i.file.size, 0)

  const addFilesFromInput = (list: FileList | null) => {
    if (!list?.length) return
    const incoming = Array.from(list)
    const combined = [...pendingItems.map((p) => p.file), ...incoming]
    const total = combined.reduce((s, f) => s + f.size, 0)
    if (total > MAX_TOTAL_BYTES) {
      toast.error("Total size of all files must be 5MB or less.")
      return
    }
    const next: PendingItem[] = [...pendingItems]
    for (const file of incoming) {
      if (!isImageFile(file) && !isPdfFile(file)) {
        toast.error(`${file.name}: only images and PDFs are allowed.`)
        continue
      }
      next.push({
        id: `${pendingId}-${file.name}-${file.size}-${next.length}-${Date.now()}`,
        file,
        objectUrl: URL.createObjectURL(file),
      })
    }
    setPendingItems(next)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removePending = (id: string) => {
    setPendingItems((prev) => {
      const found = prev.find((p) => p.id === id)
      if (found) URL.revokeObjectURL(found.objectUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleSubmit = async () => {
    if (!a || !userId) return
    const trimmedNotes = notes.trim()
    if (!trimmedNotes && pendingItems.length === 0) {
      toast.error("Add a text answer or attach at least one file.")
      return
    }
    if (totalPendingBytes > MAX_TOTAL_BYTES) {
      toast.error("Total file size must be 5MB or less.")
      return
    }
    setUploading(true)
    try {
      const uploadedUrls: string[] = []
      for (const item of pendingItems) {
        const res = await apiService.uploadImage(item.file, "courses", `assignment-${a.id}`)
        if (!res.success || !res.data?.url) {
          toast.error(`Upload failed for ${item.file.name}`)
          return
        }
        uploadedUrls.push(res.data.url)
      }
      await createSubmission({
        variables: {
          input: {
            courseId: a.courseId,
            type: "assignment",
            referenceId: a.referenceId,
            title: a.title,
            maxMarks: a.maxMarks,
            textAnswer: trimmedNotes || undefined,
            shortAnswers: trimmedNotes
              ? [
                  {
                    questionId: 1,
                    questionText: "Submission notes",
                    answer: trimmedNotes,
                  },
                ]
              : [],
            attachmentUrls: uploadedUrls.length ? uploadedUrls : undefined,
            attachmentUrl: uploadedUrls[0] ?? undefined,
          },
        },
        refetchQueries: [
          {
            query: GET_SUBMISSION_BY_REFERENCE,
            variables: {
              userId,
              courseId: a.courseId,
              type: "assignment",
              referenceId: a.referenceId,
            },
          },
          { query: GET_MY_SUBMISSIONS },
        ],
        awaitRefetchQueries: true,
      })
    } finally {
      setUploading(false)
    }
  }

  if (loadingA) {
    return (
      <div className="flex items-center gap-2 py-16 text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin" />
        Loading…
      </div>
    )
  }

  if (!a) {
    return (
      <div className="w-full py-10">
        <Card>
          <CardHeader>
            <CardTitle>Assignment not found</CardTitle>
            <CardDescription>You may not be enrolled in this course or the assignment was removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" shape="pill">
              <Link href="/student/assignments">Back to assignments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <Button asChild variant="ghost" shape="pill" className="mb-6">
        <Link href="/student/assignments">
          <ArrowLeftIcon className="size-4" />
          Back
        </Link>
      </Button>

      <Card className="bg-background/70 mb-6 rounded-3xl backdrop-blur">
        <CardHeader>
          <CardTitle>{a.title}</CardTitle>
          <CardDescription>
            {a.course?.title ?? "Course"} · Max marks {a.maxMarks}
            {a.dueDate ? ` · Due ${formatDateLong(a.dueDate)}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7">
          {a.description ? <div className="text-muted-foreground whitespace-pre-wrap">{a.description}</div> : null}
          {a.guidelines ? (
            <div className="rounded-2xl border bg-muted-surface/30 p-4">
              <div className="mb-2 font-semibold">Project guidelines</div>
              <div className="text-muted-foreground whitespace-pre-wrap">{a.guidelines}</div>
            </div>
          ) : null}
          {(a.attachmentUrls?.length ?? 0) > 0 ? (
            <div>
              <div className="mb-2 font-semibold">Instructor files</div>
              <ul className="space-y-2">
                {a.attachmentUrls.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-(--brand-secondary) hover:underline"
                    >
                      <FileTextIcon className="size-4" />
                      {url.split("/").pop() || "Download"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {graded && sub?.marks != null && (
            <p className="font-semibold text-(--brand-secondary)">
              Your marks: {sub.marks} / {sub.maxMarks}
              {sub.passingGrade ? " (pass)" : " (below pass threshold)"}
            </p>
          )}
          {graded && sub?.feedback ? (
            <div className="rounded-xl border bg-muted-surface/30 p-3 text-sm">
              <div className="mb-1 font-medium">Feedback from your instructor</div>
              <p className="whitespace-pre-wrap">{sub.feedback}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-background/70 rounded-3xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Submit work</CardTitle>
          <CardDescription>
            {!hasSubmissionRecord &&
              "Submit a text answer and/or attach files (images or PDF). Text is optional when a file is attached. Total size must not exceed 5MB."}
            {hasSubmissionRecord && canUpload &&
              "Re-attempt allowed. Add a text answer and/or files; text is optional when a file is attached. Total size must not exceed 5MB."}
            {pendingReview &&
              "Pending review — your instructor will grade this submission."}
            {graded && !canUpload && sub?.passingGrade &&
              "This assignment is graded and passed. No further uploads are allowed."}
            {graded && !canUpload && sub && !sub.passingGrade &&
              "This assignment is graded below the pass threshold. You cannot upload again until your instructor allows a resubmit from the admin grade screen."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!canUpload}
            placeholder={
              pendingItems.length > 0
                ? "Optional notes for your instructor…"
                : "Text answer (required unless you attach a file)…"
            }
            className="min-h-32"
          />

          {canUpload && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPT}
                multiple
                disabled={!canUpload}
                onChange={(e) => addFilesFromInput(e.target.files)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  shape="pill"
                  className="gap-2"
                  disabled={!canUpload}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="size-4" />
                  Choose files
                </Button>
                <span className="text-muted-foreground text-xs">
                  {(totalPendingBytes / 1024).toFixed(1)} KB / 5120 KB
                </span>
              </div>

              {pendingItems.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-medium">Ready to upload (preview)</p>
                  <div className="flex flex-wrap gap-3">
                    {pendingItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative flex w-[7.5rem] flex-col overflow-hidden rounded-xl border bg-muted-surface/40"
                      >
                        <button
                          type="button"
                          className="bg-background/80 absolute right-1 top-1 rounded-full p-1 shadow hover:bg-destructive/20"
                          onClick={() => removePending(item.id)}
                          aria-label="Remove file"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                        <div className="flex h-24 items-center justify-center bg-black/5">
                          {isImageFile(item.file) ? (
                            // eslint-disable-next-line @next/next/no-img-element -- blob preview
                            <img src={item.objectUrl} alt="" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <FileTextIcon className="text-(--brand-secondary) size-10" />
                          )}
                        </div>
                        <p className="truncate px-1.5 py-1 text-center text-[10px] text-muted-foreground" title={item.file.name}>
                          {item.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasSubmissionRecord && submittedUrls.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">Submitted files</p>
              <div className="flex flex-wrap gap-3">
                {submittedUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "flex w-[7.5rem] flex-col overflow-hidden rounded-xl border bg-muted-surface/40 transition-opacity hover:opacity-90"
                    )}
                  >
                    <div className="flex h-24 items-center justify-center bg-black/5">
                      {urlLooksLikeImage(url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <FileTextIcon className="text-(--brand-secondary) size-10" />
                      )}
                    </div>
                    <span className="truncate px-1.5 py-1 text-center text-[10px] text-(--brand-secondary) underline">
                      Open
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="brand-secondary"
            shape="pill"
            disabled={!canUpload || uploading || submitting}
            onClick={() => void handleSubmit()}
          >
            {uploading || submitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : !canUpload ? (
              pendingReview ? (
                "Pending review"
              ) : graded && sub?.passingGrade ? (
                "Closed"
              ) : (
                "Locked"
              )
            ) : hasSubmissionRecord ? (
              "Submit again"
            ) : (
              "Submit"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
