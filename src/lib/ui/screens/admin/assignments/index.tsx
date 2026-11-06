"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { Loader2Icon, NotebookPenIcon, RefreshCwIcon, Trash2Icon, UploadIcon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import {
  CREATE_COURSE_ASSIGNMENT,
  DELETE_COURSE_ASSIGNMENT,
  GET_COURSE_ASSIGNMENTS,
  GET_COURSES,
  PUBLISH_COURSE_ASSIGNMENT,
} from "@/lib/graphql"
import { filterCoursesForGrader } from "@/lib/helpers/grader-courses"
import { cn, getStaffEyebrow } from "@/lib/helpers"
import { useUser } from "@/lib/providers/user"
import { apiService } from "@/lib/services"

type AssignmentRow = {
  id: string
  courseId: string
  title: string
  description: string | null
  guidelines: string | null
  attachmentUrls: string[]
  maxMarks: number
  referenceId: string
  dueDate: string | null
  isPublished: boolean
  createdAt: string
}

const ACCEPT = "image/*,.pdf,application/pdf,.ppt,.pptx,.doc,.docx,.zip"

export const AdminAssignmentsScreen = () => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [guidelines, setGuidelines] = useState("")
  const [markingGuide, setMarkingGuide] = useState("")
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [maxMarks, setMaxMarks] = useState<string>("100")
  const [dueDate, setDueDate] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { userProfileInfo } = useUser()

  const { data: coursesData, refetch: refetchCourses } = useQuery<{
    getCourses: Array<{ id: string; title: string; slug: string }>
  }>(GET_COURSES, { fetchPolicy: "network-only" })
  const allCourses = coursesData?.getCourses ?? []
  const courses = useMemo(
    () => filterCoursesForGrader(allCourses, userProfileInfo?.role, userProfileInfo?.allowedMarkGradesOn),
    [allCourses, userProfileInfo?.role, userProfileInfo?.allowedMarkGradesOn]
  )

  const courseId = selectedCourseId || courses[0]?.id || ""

  const { data: assignmentsData, loading, refetch } = useQuery<{
    getCourseAssignments: AssignmentRow[]
  }>(GET_COURSE_ASSIGNMENTS, {
    variables: { courseId },
    skip: !courseId,
    fetchPolicy: "network-only",
  })

  useEffect(() => {
    refetchCourses()
  }, [refetchCourses])

  const [createAssignment, { loading: creating }] = useMutation(CREATE_COURSE_ASSIGNMENT, {
    onCompleted: () => {
      setTitle("")
      setDescription("")
      setGuidelines("")
      setMarkingGuide("")
      setAttachmentUrls([])
      setMaxMarks("100")
      setDueDate("")
      toast.success("Assignment created as draft. Publish it so students can see it.")
      refetch()
    },
    onError: (e) => toast.error(e.message ?? "Failed to create assignment."),
  })

  const [publishAssignment, { loading: publishing }] = useMutation(PUBLISH_COURSE_ASSIGNMENT, {
    onCompleted: () => {
      toast.success("Assignment published.")
      refetch()
    },
    onError: (e) => toast.error(e.message ?? "Failed to publish."),
  })

  const [deleteAssignment, { loading: deleting }] = useMutation(DELETE_COURSE_ASSIGNMENT, {
    onCompleted: () => {
      toast.success("Assignment removed.")
      refetch()
    },
    onError: (e) => toast.error(e.message ?? "Failed to delete."),
  })

  const assignments = assignmentsData?.getCourseAssignments ?? []

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refetchCourses(), courseId ? refetch() : Promise.resolve()])
      toast.success("Refreshed.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !courseId) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const res = await apiService.uploadImage(file, "assignments", courseId)
        if (!res?.success || !res.data?.url) {
          throw new Error(res?.message || `Failed to upload ${file.name}`)
        }
        urls.push(res.data.url)
      }
      setAttachmentUrls((prev) => [...prev, ...urls])
      toast.success(urls.length === 1 ? "File uploaded." : `${urls.length} files uploaded.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return
    const max = parseInt(maxMarks, 10)
    if (Number.isNaN(max) || max < 1) {
      toast.error("Enter a positive max marks value.")
      return
    }
    if (!title.trim()) {
      toast.error("Title is required.")
      return
    }
    createAssignment({
      variables: {
        input: {
          courseId,
          title: title.trim(),
          description: description.trim() || undefined,
          guidelines: guidelines.trim() || undefined,
          markingGuide: markingGuide.trim() || undefined,
          attachmentUrls: attachmentUrls.length ? attachmentUrls : undefined,
          maxMarks: max,
          dueDate: dueDate.trim() ? new Date(dueDate).toISOString() : undefined,
        },
      },
    })
  }

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-secondary">{getStaffEyebrow(userProfileInfo?.role)}</div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Course assignments
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
            Create assignments for your course. Optionally attach files and project guidelines. Publish when ready —
            students submit work and you grade it from Grade Submissions.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="default"
          shape="pill"
          onClick={handleRefresh}
          disabled={isRefreshing || courses.length === 0}
          className="shrink-0 gap-2"
        >
          <RefreshCwIcon className={cn("size-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mb-6">
        <label className="text-muted-foreground mb-2 block text-sm font-medium">Course</label>
        {courses.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-sm">
            No courses available for your account.
          </p>
        ) : (
          <select
            value={courseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="border-input bg-background rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-secondary)"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {courses.length === 0 ? null : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <Card className="bg-background/70 h-fit rounded-3xl backdrop-blur">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <NotebookPenIcon className="size-5 text-(--brand-secondary)" />
                New assignment
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Module 3 written report"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">Description (optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary for students…"
                    className="min-h-[72px] resize-y"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Project guidelines (optional)
                  </label>
                  <Textarea
                    value={guidelines}
                    onChange={(e) => setGuidelines(e.target.value)}
                    placeholder="Requirements, deliverables, rubric notes…"
                    className="min-h-[96px] resize-y"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Marking guide (optional, staff only)
                  </label>
                  <Textarea
                    value={markingGuide}
                    onChange={(e) => setMarkingGuide(e.target.value)}
                    placeholder="How to award marks, e.g. 4 for layout, 4 for working code, 2 for a README. Students never see this."
                    maxLength={5000}
                    className="min-h-[72px] resize-y"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">
                    Attachments (optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(e) => void handleUpload(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    shape="pill"
                    className="w-full gap-2"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
                    Upload files
                  </Button>
                  {attachmentUrls.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {attachmentUrls.map((url) => (
                        <li
                          key={url}
                          className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-(--brand-secondary) hover:underline"
                          >
                            {url.split("/").pop() || "File"}
                          </a>
                          <button
                            type="button"
                            className="text-destructive shrink-0"
                            onClick={() => setAttachmentUrls((prev) => prev.filter((u) => u !== url))}
                          >
                            <Trash2Icon className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">Total marks</label>
                  <Input
                    type="number"
                    min={1}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="w-full max-w-[8rem]"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs font-medium">Due date (optional)</label>
                  <Input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full max-w-[14rem]"
                  />
                </div>
                <Button
                  type="submit"
                  variant="brand-secondary"
                  shape="pill"
                  className="w-full"
                  disabled={creating || uploading}
                >
                  {creating ? <Loader2Icon className="size-4 animate-spin" /> : "Create assignment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-background/70 overflow-hidden rounded-3xl backdrop-blur">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-muted-foreground flex items-center justify-center gap-2 py-16">
                  <Loader2Icon className="size-6 animate-spin" />
                  <span>Loading assignments…</span>
                </div>
              ) : assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                  <NotebookPenIcon className="text-muted-foreground/40 size-12" />
                  <p className="text-muted-foreground">No assignments for this course yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted-surface/40 border-b">
                      <tr>
                        <th className="p-4 font-semibold">Title</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Max marks</th>
                        <th className="p-4 font-semibold">Due</th>
                        <th className="p-4 font-semibold">Created</th>
                        <th className="p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a.id} className="hover:bg-muted-surface/20 border-b transition-colors">
                          <td className="p-4">
                            <Link
                              href={`/admin/assignments/${a.id}`}
                              className="font-medium text-(--brand-secondary) hover:underline"
                            >
                              {a.title}
                            </Link>
                            {a.description ? (
                              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{a.description}</p>
                            ) : null}
                            {(a.attachmentUrls?.length ?? 0) > 0 || a.guidelines ? (
                              <p className="text-muted-foreground mt-1 text-xs">
                                {[
                                  a.guidelines ? "Guidelines" : null,
                                  (a.attachmentUrls?.length ?? 0) > 0
                                    ? `${a.attachmentUrls.length} file(s)`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            ) : null}
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "rounded-full px-2 py-1 text-xs font-medium",
                                a.isPublished ? "bg-green-500/20 text-green-700" : "bg-amber-500/20 text-amber-700"
                              )}
                            >
                              {a.isPublished ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td className="p-4">{a.maxMarks}</td>
                          <td className="text-muted-foreground p-4 text-xs">
                            {a.dueDate ? new Date(a.dueDate).toLocaleString() : "—"}
                          </td>
                          <td className="text-muted-foreground p-4 text-xs">
                            {new Date(a.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {!a.isPublished && (
                                <Button
                                  type="button"
                                  variant="brand-secondary"
                                  size="sm"
                                  shape="pill"
                                  disabled={publishing}
                                  onClick={() => publishAssignment({ variables: { id: a.id } })}
                                >
                                  Publish
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                shape="pill"
                                className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
                                disabled={deleting}
                                onClick={() => {
                                  if (!confirm("Delete this assignment?")) return
                                  deleteAssignment({ variables: { id: a.id } })
                                }}
                              >
                                <Trash2Icon className="size-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
