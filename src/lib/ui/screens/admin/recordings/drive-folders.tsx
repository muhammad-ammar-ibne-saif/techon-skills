"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "@apollo/client/react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  AlertTriangleIcon,
  FolderIcon,
  FolderPlusIcon,
  Loader2Icon,
  RefreshCwIcon,
  UnlinkIcon,
  UsersRoundIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Input } from "@/lib/ui/useable-components/input"
import {
  GET_BATCHES,
  GET_RECORDING_FOLDERS,
  LINK_RECORDING_FOLDER,
  SYNC_RECORDING_FOLDER,
  UNLINK_RECORDING_FOLDER,
  UPDATE_RECORDING_FOLDER,
} from "@/lib/graphql"
import { formatDate } from "@/lib/helpers"
import { CONFIG } from "@/utils/constants"

type Folder = {
  id: string
  courseId: string
  course?: { id: string; title: string } | null
  batchIds: string[]
  batches: { id: string; name: string }[]
  name: string
  driveFolderId: string
  lastSyncedAt: string | null
  lastSyncError: string | null
  recordingCount: number
}
type FolderSync = { added: number; folder: Folder }

/** null = closed; id null = linking a new folder, otherwise editing who can watch that folder. */
type FormState = { id: string | null; courseId: string; folderLink: string; batchIds: string[] } | null

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

export function DriveFolders({
  courses,
  courseFilter,
  onChanged,
}: {
  courses: { id: string; title: string }[]
  courseFilter: string
  /** Recordings were added or removed. */
  onChanged: () => void
}) {
  const [form, setForm] = useState<FormState>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const { data, refetch } = useQuery<{ getRecordingFolders: Folder[] }>(GET_RECORDING_FOLDERS, {
    variables: { courseId: courseFilter || null },
    fetchPolicy: "network-only",
  })
  const folders = data?.getRecordingFolders ?? []

  const { data: batchesData } = useQuery<{ getBatches: { id: string; name: string; isArchived: boolean }[] }>(
    GET_BATCHES,
    {
      variables: { courseId: form?.courseId ?? "", includeArchived: true },
      skip: !form?.courseId,
      fetchPolicy: "network-only",
    }
  )
  const formBatches = (batchesData?.getBatches ?? []).filter((b) => !b.isArchived || form?.batchIds.includes(b.id))
  const toggleBatch = (id: string) =>
    setForm(
      (f) => f && { ...f, batchIds: f.batchIds.includes(id) ? f.batchIds.filter((b) => b !== id) : [...f.batchIds, id] }
    )

  const onError = (e: Error) => toast.error(e.message)
  const reportSync = ({ added, folder }: FolderSync) => {
    if (folder.lastSyncError) toast.error(folder.lastSyncError)
    else toast.success(added ? `Added ${plural(added, "new recording")}` : "No new videos in this folder")
    refetch()
    if (added) onChanged()
  }

  const [linkFolder, { loading: linking }] = useMutation<{ linkRecordingFolder: FolderSync }>(LINK_RECORDING_FOLDER, {
    onCompleted: (d) => {
      setForm(null)
      reportSync(d.linkRecordingFolder)
    },
    onError,
  })
  const [updateFolder, { loading: updating }] = useMutation(UPDATE_RECORDING_FOLDER, {
    onCompleted: () => {
      toast.success("Updated who can watch this folder")
      setForm(null)
      refetch()
      onChanged()
    },
    onError,
  })
  const [syncFolder] = useMutation<{ syncRecordingFolder: FolderSync }>(SYNC_RECORDING_FOLDER, { onError })
  const [unlinkFolder] = useMutation(UNLINK_RECORDING_FOLDER, { onError })

  const runSync = async (f: Folder) => {
    setSyncingId(f.id)
    try {
      const res = await syncFolder({ variables: { id: f.id } })
      if (res.data) reportSync(res.data.syncRecordingFolder)
    } finally {
      setSyncingId(null)
    }
  }

  const runUnlink = async (f: Folder) => {
    if (!window.confirm(`Stop picking up new videos from "${f.name}"?`)) return
    const removeRecordings = window.confirm(
      `Also hide its ${plural(f.recordingCount, "recording")} from students?\n\nOK = hide them, Cancel = keep them.`
    )
    const res = await unlinkFolder({ variables: { id: f.id, removeRecordings } })
    if (res.data == null) return
    toast.success("Folder unlinked")
    refetch()
    if (removeRecordings) onChanged()
  }

  const save = () => {
    if (!form) return
    if (form.id) return updateFolder({ variables: { id: form.id, batchIds: form.batchIds } })
    if (!form.courseId) return toast.error("Choose a course")
    if (!form.folderLink.trim()) return toast.error("Paste the Google Drive folder link")
    linkFolder({ variables: { courseId: form.courseId, folderLink: form.folderLink.trim(), batchIds: form.batchIds } })
  }

  return (
    <section className="mb-6 rounded-3xl border bg-background/70 p-5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Drive folders</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm text-pretty">
            Link a course or batch folder once. Every video in it (and its subfolders) shows up for students
            automatically. The portal checks for new videos every 10 minutes.
          </p>
        </div>
        <Button
          variant="outline"
          shape="pill"
          className="gap-2"
          disabled={!courses.length}
          onClick={() =>
            setForm({ id: null, courseId: courseFilter || courses[0]?.id || "", folderLink: "", batchIds: [] })
          }
        >
          <FolderPlusIcon className="size-4" />
          Link a Drive folder
        </Button>
      </div>

      {folders.length > 0 && (
        <ul className="mt-4 divide-y rounded-2xl border">
          {folders.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <FolderIcon className="text-(--brand-primary) size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <a
                  href={`https://drive.google.com/drive/folders/${f.driveFolderId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  {f.name}
                </a>
                <div className="text-muted-foreground text-xs">
                  {f.course?.title ?? "—"} ·{" "}
                  {f.batches.length ? f.batches.map((b) => b.name).join(", ") : "All batches"} ·{" "}
                  {plural(f.recordingCount, "recording")}
                  {f.lastSyncedAt && ` · checked ${formatDate(f.lastSyncedAt)}`}
                </div>
                {f.lastSyncError && (
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                    {f.lastSyncError}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Check for new videos now"
                  onClick={() => runSync(f)}
                  disabled={syncingId === f.id}
                >
                  <RefreshCwIcon className={syncingId === f.id ? "size-4 animate-spin" : "size-4"} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Who can watch"
                  onClick={() => setForm({ id: f.id, courseId: f.courseId, folderLink: "", batchIds: f.batchIds })}
                >
                  <UsersRoundIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Unlink folder"
                  className="text-destructive"
                  onClick={() => runUnlink(f)}
                >
                  <UnlinkIcon className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DialogPrimitive.Root open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border bg-background p-6 shadow-xl outline-none">
            <DialogPrimitive.Title className="text-lg font-semibold">
              {form?.id ? "Who can watch this folder" : "Link a Drive folder"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-muted-foreground mt-1 text-sm">
              {form?.id
                ? "Its recordings, including ones added later, follow this choice."
                : "Share the folder with the portal's address (shown below the page title) as Editor first."}
            </DialogPrimitive.Description>
            {form && (
              <div className="mt-4 space-y-4">
                {!form.id && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Course</label>
                      <select
                        value={form.courseId}
                        onChange={(e) => setForm({ ...form, courseId: e.target.value, batchIds: [] })}
                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Google Drive folder link</label>
                      <Input
                        value={form.folderLink}
                        onChange={(e) => setForm({ ...form, folderLink: e.target.value })}
                        placeholder="https://drive.google.com/drive/folders/…"
                      />
                    </div>
                  </>
                )}
                <fieldset>
                  <legend className="mb-1 text-sm font-medium">Who can watch</legend>
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
                          onChange={() => setForm({ ...form, batchIds: [] })}
                        />
                        All batches
                      </label>
                      {formBatches.map((b) => (
                        <label key={b.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.batchIds.includes(b.id)}
                            onChange={() => toggleBatch(b.id)}
                          />
                          {b.name}
                          {b.isArchived && <span className="text-muted-foreground text-xs">(archived)</span>}
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button variant="brand-secondary" onClick={save} disabled={linking || updating}>
                {linking || updating ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : form?.id ? (
                  "Save"
                ) : (
                  "Link folder"
                )}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </section>
  )
}
