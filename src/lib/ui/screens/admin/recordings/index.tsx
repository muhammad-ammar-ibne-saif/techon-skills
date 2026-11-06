"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  VideoIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { ConfirmDialog } from "@/lib/ui/useable-components/confirm-dialog"
import { RecordingPlayerDialog } from "@/lib/ui/useable-components/recording-player"
import {
  CHECK_RECORDING_ACCESS,
  CREATE_RECORDING,
  DELETE_RECORDING,
  GET_BATCHES,
  GET_COURSES,
  GET_RECORDINGS_FOR_STAFF,
  GET_RECORDINGS_SETUP,
  UPDATE_RECORDING,
} from "@/lib/graphql"
import { filterCoursesForGrader } from "@/lib/helpers/grader-courses"
import { formatDate, getStaffEyebrow } from "@/lib/helpers"
import { useUser } from "@/lib/providers/user"
import { CONFIG } from "@/utils/constants"

import { DriveFolders } from "./drive-folders"

type RecordingRow = {
  id: string
  courseId: string
  course?: { id: string; title: string } | null
  batchIds: string[]
  batches: { id: string; name: string }[]
  title: string
  description: string
  recordedAt: string
  durationSeconds: number | null
  isPublished: boolean
  driveFileName: string | null
}

type FormState = {
  title: string
  description: string
  driveLink: string
  recordedAt: string
  isPublished: boolean
  courseId: string
  /** Empty = every batch of the course. */
  batchIds: string[]
}

const today = () => new Date().toISOString().slice(0, 10)
const emptyForm = (courseId: string): FormState => ({
  title: "",
  description: "",
  driveLink: "",
  recordedAt: today(),
  isPublished: true,
  courseId,
  batchIds: [],
})

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m} min`
}

export const AdminRecordingsScreen = () => {
  const { userProfileInfo } = useUser()
  const [courseFilter, setCourseFilter] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm(""))
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [preview, setPreview] = useState<RecordingRow | null>(null)

  const { data: setupData } = useQuery<{ getRecordingsSetup: { driveConfigured: boolean; serviceAccountEmail: string | null } }>(GET_RECORDINGS_SETUP)
  const setup = setupData?.getRecordingsSetup

  const { data: coursesData } = useQuery<{ getCourses: Array<{ id: string; title: string; slug: string }> }>(GET_COURSES)
  const courses = useMemo(
    () => filterCoursesForGrader(coursesData?.getCourses ?? [], userProfileInfo?.role, userProfileInfo?.allowedMarkGradesOn),
    [coursesData, userProfileInfo?.role, userProfileInfo?.allowedMarkGradesOn]
  )

  const { data, loading, error, refetch } = useQuery<{ getRecordingsForStaff: RecordingRow[] }>(GET_RECORDINGS_FOR_STAFF, {
    variables: { courseId: courseFilter || null },
    fetchPolicy: "network-only",
  })
  const recordings = data?.getRecordingsForStaff ?? []

  const { data: batchesData } = useQuery<{ getBatches: { id: string; name: string; isArchived: boolean }[] }>(GET_BATCHES, {
    variables: { courseId: form.courseId, includeArchived: true },
    skip: !formOpen || !form.courseId,
    fetchPolicy: "network-only",
  })
  // Active batches, plus archived ones this recording is already limited to.
  const formBatches = (batchesData?.getBatches ?? []).filter((b) => !b.isArchived || form.batchIds.includes(b.id))
  const toggleFormBatch = (id: string) =>
    setForm((f) => ({ ...f, batchIds: f.batchIds.includes(id) ? f.batchIds.filter((b) => b !== id) : [...f.batchIds, id] }))

  const onSaved = (message: string) => {
    toast.success(message)
    setFormOpen(false)
    setEditId(null)
    refetch()
  }
  const [createRecording, { loading: creating }] = useMutation(CREATE_RECORDING, {
    onCompleted: () => onSaved("Recording added"),
    onError: (e) => toast.error(e.message),
  })
  const [updateRecording, { loading: updating }] = useMutation(UPDATE_RECORDING, {
    onCompleted: () => onSaved("Recording updated"),
    onError: (e) => toast.error(e.message),
  })
  const [deleteRecording, { loading: deleting }] = useMutation(DELETE_RECORDING, {
    onCompleted: () => {
      toast.success("Recording removed")
      setDeleteId(null)
      refetch()
    },
    onError: (e) => toast.error(e.message),
  })
  const [checkAccess] = useMutation<{ checkRecordingAccess: { ok: boolean; message: string } }>(CHECK_RECORDING_ACCESS)

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm(courseFilter || courses[0]?.id || ""))
    setFormOpen(true)
  }
  const openEdit = (r: RecordingRow) => {
    setEditId(r.id)
    setForm({
      title: r.title,
      description: r.description,
      driveLink: "",
      recordedAt: r.recordedAt.slice(0, 10),
      isPublished: r.isPublished,
      courseId: r.courseId,
      batchIds: r.batchIds ?? [],
    })
    setFormOpen(true)
  }

  const handleSave = () => {
    if (!form.courseId) return toast.error("Choose a course")
    if (!form.title.trim()) return toast.error("Title is required")
    if (!editId && !form.driveLink.trim()) return toast.error("Paste the Google Drive link")
    if (editId) {
      updateRecording({
        variables: {
          input: {
            id: editId,
            courseId: form.courseId,
            title: form.title.trim(),
            description: form.description,
            recordedAt: form.recordedAt,
            isPublished: form.isPublished,
            batchIds: form.batchIds,
            ...(form.driveLink.trim() ? { driveLink: form.driveLink.trim() } : {}),
          },
        },
      })
    } else {
      createRecording({
        variables: {
          input: {
            courseId: form.courseId,
            title: form.title.trim(),
            description: form.description,
            driveLink: form.driveLink.trim(),
            recordedAt: form.recordedAt,
            isPublished: form.isPublished,
            batchIds: form.batchIds,
          },
        },
      })
    }
  }

  const togglePublished = (r: RecordingRow) =>
    updateRecording({ variables: { input: { id: r.id, isPublished: !r.isPublished } } })

  const runCheck = async (r: RecordingRow) => {
    const res = await checkAccess({ variables: { id: r.id } })
    const result = res.data?.checkRecordingAccess
    if (result?.ok) toast.success(result.message)
    else toast.error(result?.message ?? "Check failed")
  }

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-secondary">{getStaffEyebrow(userProfileInfo?.role)}</div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Lecture recordings</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
            Recordings stay private in Google Drive. Students watch them only inside the portal, and lose access as soon as
            they are locked (fees, block, bin) or removed from the course.
          </p>
        </div>
        <Button variant="brand-secondary" shape="pill" className="gap-2" onClick={openCreate} disabled={!courses.length}>
          <PlusIcon className="size-4" />
          Add one video
        </Button>
      </div>

      {setup && !setup.driveConfigured && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-400/50 bg-amber-50/60 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangleIcon className="mt-0.5 size-5 shrink-0" />
          <div>
            <div className="font-semibold">Google Drive isn&apos;t connected yet</div>
            <div className="mt-1">The server needs a Google service account (GOOGLE_SERVICE_ACCOUNT_JSON). Until it is set, recordings can&apos;t be added or played.</div>
          </div>
        </div>
      )}
      {setup?.driveConfigured && setup.serviceAccountEmail && (
        <div className="mb-6 flex gap-3 rounded-2xl border bg-background/60 p-4 text-sm">
          <ShieldCheckIcon className="text-(--brand-primary) mt-0.5 size-5 shrink-0" />
          <div>
            <div className="font-semibold">How to set it up</div>
            <ol className="text-muted-foreground mt-1 list-decimal space-y-0.5 pl-5">
              <li>
                In Google Drive, share each course or batch folder with{" "}
                <span className="text-primary select-all font-mono text-xs">{setup.serviceAccountEmail}</span> as <b>Editor</b> (Meet recordings block downloads for Viewers; the portal only reads).
                Keep General access on &quot;Restricted&quot; and don&apos;t share it with students.
              </li>
              <li>
                Click <b>Link a Drive folder</b> below, paste the folder link, and choose the course (and{" "}
                <Link href={CONFIG.ROUTES.ADMIN.BATCHES} className="text-primary underline">
                  batch
                </Link>
                , if the folder is for one batch).
              </li>
              <li>That&apos;s it: every video you put in the folder appears for those students. They never see the Drive link.</li>
            </ol>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Course</label>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="border-input bg-background h-10 rounded-full border px-4 text-sm"
        >
          <option value="">All my courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      <DriveFolders courses={courses} courseFilter={courseFilter} onChanged={() => refetch()} />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2Icon className="size-6 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-destructive">Failed to load recordings: {error.message}</div>
      ) : (
        <Card className="bg-background/70 backdrop-blur rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted-surface/40">
                  <tr>
                    <th className="p-4 font-semibold">Recording</th>
                    <th className="p-4 font-semibold">Course</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Length</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map((r) => (
                    <tr key={r.id} className="border-b transition-colors hover:bg-muted-surface/20">
                      <td className="p-4">
                        <div className="font-medium">{r.title}</div>
                        {r.driveFileName && <div className="text-muted-foreground text-xs">{r.driveFileName}</div>}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <div>{r.course?.title ?? "—"}</div>
                        <div className="text-xs">
                          {r.batches?.length ? r.batches.map((b) => b.name).join(", ") : "All batches"}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">{formatDate(r.recordedAt)}</td>
                      <td className="p-4 text-muted-foreground text-xs">{formatDuration(r.durationSeconds)}</td>
                      <td className="p-4">
                        <span className={r.isPublished ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600" : "rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-500"}>
                          {r.isPublished ? "Visible to students" : "Hidden"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Preview" onClick={() => setPreview(r)}>
                            <VideoIcon className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title={r.isPublished ? "Hide from students" : "Show to students"} onClick={() => togglePublished(r)}>
                            {r.isPublished ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" title="Check Drive access" onClick={() => runCheck(r)}>
                            <CheckCircle2Icon className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(r)}>
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Remove" className="text-destructive" onClick={() => setDeleteId(r.id)}>
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recordings.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <VideoIcon className="size-12 mx-auto mb-4 opacity-50" />
                <p>No recordings yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remove recording"
        description="Students will no longer see this recording. The file stays in your Google Drive."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => deleteId && deleteRecording({ variables: { id: deleteId } })}
        loading={deleting}
      />

      <RecordingPlayerDialog
        recordingId={preview?.id ?? null}
        title={preview?.title ?? ""}
        onClose={() => setPreview(null)}
      />

      <DialogPrimitive.Root open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditId(null) }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border bg-background p-6 shadow-xl outline-none">
            <DialogPrimitive.Title className="text-lg font-semibold">{editId ? "Edit recording" : "Add one video"}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">
              For a single video file. To add a whole folder, use &quot;Link a Drive folder&quot; instead.
            </DialogPrimitive.Description>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Course</label>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value, batchIds: [] }))}
                  className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <fieldset>
                <legend className="text-sm font-medium mb-1">Who can watch</legend>
                {formBatches.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Everyone enrolled in this course. To limit it to a batch, first{" "}
                    <Link href={CONFIG.ROUTES.ADMIN.BATCHES} className="text-primary underline">
                      create batches
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="space-y-1.5 rounded-md border p-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.batchIds.length === 0}
                        onChange={() => setForm((f) => ({ ...f, batchIds: [] }))}
                      />
                      All batches
                    </label>
                    {formBatches.map((b) => (
                      <label key={b.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.batchIds.includes(b.id)} onChange={() => toggleFormBatch(b.id)} />
                        {b.name}
                        {b.isArchived && <span className="text-muted-foreground text-xs">(archived)</span>}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 3 – React hooks" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Google Drive link {editId && <span className="text-muted-foreground font-normal">(leave empty to keep the current file)</span>}</label>
                <Input value={form.driveLink} onChange={(e) => setForm((f) => ({ ...f, driveLink: e.target.value }))} placeholder="https://drive.google.com/file/d/…/view" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date recorded</label>
                <Input type="date" value={form.recordedAt} onChange={(e) => setForm((f) => ({ ...f, recordedAt: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                Visible to students
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button variant="brand-secondary" onClick={handleSave} disabled={creating || updating}>
                {creating || updating ? <Loader2Icon className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
