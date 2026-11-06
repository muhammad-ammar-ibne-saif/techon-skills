"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CheckIcon,
  CombineIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import {
  CREATE_BATCH,
  GET_BATCH_ROSTER,
  GET_BATCHES,
  GET_COURSES,
  MERGE_BATCHES,
  SET_STUDENTS_BATCH,
  UPDATE_BATCH,
} from "@/lib/graphql"
import { filterCoursesForGrader } from "@/lib/helpers/grader-courses"
import { cn, getStaffEyebrow } from "@/lib/helpers"
import { useUser } from "@/lib/providers/user"
import { BatchEnrollmentPanel, batchEnrollmentSummary, type EnrollmentBatch } from "./enrollment-panel"

type Batch = EnrollmentBatch & { courseId: string; isArchived: boolean; studentCount: number }
type RosterStudent = { id: string; fullName: string | null; email: string; batchId: string | null }

const NO_BATCH = ""
const selectCls = "border-input bg-background h-9 rounded-md border px-2 text-sm"

export const AdminBatchesScreen = () => {
  const { userProfileInfo } = useUser()
  const [pickedCourseId, setPickedCourseId] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [newName, setNewName] = useState("")
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [batchFilter, setBatchFilter] = useState<"all" | "none" | string>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBatch, setBulkBatch] = useState(NO_BATCH)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeInto, setMergeInto] = useState("")
  const [mergeFrom, setMergeFrom] = useState<Set<string>>(new Set())
  const [settingsId, setSettingsId] = useState<string | null>(null)

  const { data: coursesData } = useQuery<{ getCourses: { id: string; title: string }[] }>(GET_COURSES)
  const courses = useMemo(
    () =>
      filterCoursesForGrader(
        coursesData?.getCourses ?? [],
        userProfileInfo?.role,
        userProfileInfo?.allowedMarkGradesOn
      ),
    [coursesData, userProfileInfo?.role, userProfileInfo?.allowedMarkGradesOn]
  )
  const courseId = pickedCourseId || courses[0]?.id || ""

  const batchesQuery = useQuery<{ getBatches: Batch[] }>(GET_BATCHES, {
    variables: { courseId, includeArchived: true },
    skip: !courseId,
    fetchPolicy: "network-only",
  })
  const rosterQuery = useQuery<{ getBatchRoster: RosterStudent[] }>(GET_BATCH_ROSTER, {
    variables: { courseId },
    skip: !courseId,
    fetchPolicy: "network-only",
  })
  const allBatches = batchesQuery.data?.getBatches ?? []
  const activeBatches = allBatches.filter((b) => !b.isArchived)
  const listedBatches = showArchived ? allBatches : activeBatches
  const batchName = (id: string | null) => allBatches.find((b) => b.id === id)?.name
  const roster = rosterQuery.data?.getBatchRoster ?? []
  const visibleRoster = roster.filter((s) =>
    batchFilter === "all" ? true : batchFilter === "none" ? !s.batchId : s.batchId === batchFilter
  )
  const unassigned = roster.filter((s) => !s.batchId).length

  const refreshAll = () => {
    batchesQuery.refetch()
    rosterQuery.refetch()
  }
  const onError = (e: Error) => toast.error(e.message)

  const [createBatch, { loading: creating }] = useMutation(CREATE_BATCH, {
    onCompleted: () => {
      toast.success("Batch created")
      setNewName("")
      refreshAll()
    },
    onError,
  })
  const [updateBatch] = useMutation(UPDATE_BATCH, {
    onCompleted: () => {
      setRenameId(null)
      refreshAll()
    },
    onError,
  })
  const [setStudentsBatch, { loading: moving }] = useMutation<{ setStudentsBatch: number }>(SET_STUDENTS_BATCH, {
    onError,
  })
  const [mergeBatches, { loading: merging }] = useMutation<{ mergeBatches: number }>(MERGE_BATCHES, { onError })

  const closeMerge = () => {
    setMergeOpen(false)
    setMergeInto("")
    setMergeFrom(new Set())
  }
  const toggleMergeFrom = (id: string) =>
    setMergeFrom((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const submitMerge = async () => {
    const from = [...mergeFrom].filter((id) => id !== mergeInto)
    if (!mergeInto || !from.length) return toast.error("Pick the batch to keep and at least one batch to merge into it")
    const names = from.map((id) => batchName(id)).join(", ")
    if (!window.confirm(`Move every student of ${names} into ${batchName(mergeInto)} and archive ${names}?`)) return
    const res = await mergeBatches({ variables: { fromBatchIds: from, intoBatchId: mergeInto } })
    if (res.data == null) return
    toast.success(
      `Merged into ${batchName(mergeInto)} (${res.data.mergeBatches} student${res.data.mergeBatches === 1 ? "" : "s"} moved)`
    )
    closeMerge()
    setBatchFilter("all")
    refreshAll()
  }

  const changeCourse = (id: string) => {
    setPickedCourseId(id)
    setSelected(new Set())
    setBatchFilter("all")
    setBulkBatch(NO_BATCH)
    closeMerge()
  }

  const moveStudents = async (userIds: string[], batchId: string) => {
    const res = await setStudentsBatch({ variables: { courseId, userIds, batchId: batchId || null } })
    if (res.data == null) return
    toast.success(batchId ? `Moved to ${batchName(batchId) ?? "batch"}` : "Removed from batch")
    setSelected(new Set())
    refreshAll()
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const allVisibleSelected = visibleRoster.length > 0 && visibleRoster.every((s) => selected.has(s.id))
  const toggleAllVisible = () => setSelected(allVisibleSelected ? new Set() : new Set(visibleRoster.map((s) => s.id)))

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">{getStaffEyebrow(userProfileInfo?.role)}</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Batches</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          Split a course into batches and place each student in one. A recording limited to a batch can only be watched
          by students in that batch; recordings for &quot;all batches&quot; stay visible to the whole course.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Course</label>
        <select
          value={courseId}
          onChange={(e) => changeCourse(e.target.value)}
          className="border-input bg-background h-10 rounded-full border px-4 text-sm"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {!courseId ? (
        <p className="text-muted-foreground py-12 text-center">No courses yet.</p>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <Card className="bg-background/70 rounded-3xl backdrop-blur">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Batches</h2>
                <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                  Show archived
                </label>
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newName.trim()) return toast.error("Enter a batch name")
                  createBatch({ variables: { courseId, name: newName.trim() } })
                }}
              >
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Batch 3 – Jan 2027"
                />
                <Button type="submit" variant="brand-secondary" size="icon" disabled={creating} title="Add batch">
                  {creating ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
                </Button>
              </form>

              {batchesQuery.loading && !batchesQuery.data ? (
                <div className="text-muted-foreground flex justify-center py-6">
                  <Loader2Icon className="size-5 animate-spin" />
                </div>
              ) : listedBatches.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No batches yet. Add the first one above.
                </p>
              ) : (
                <ul className="divide-y rounded-2xl border">
                  {listedBatches.map((b) => (
                    <li key={b.id} className={cn(b.isArchived && "opacity-60")}>
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      {renameId === b.id ? (
                        <form
                          className="flex flex-1 items-center gap-1"
                          onSubmit={(e) => {
                            e.preventDefault()
                            updateBatch({ variables: { id: b.id, name: renameValue } })
                          }}
                        >
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                          <Button type="submit" variant="ghost" size="icon" title="Save">
                            <CheckIcon className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Cancel"
                            onClick={() => setRenameId(null)}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => setBatchFilter(b.id)}
                            title="Show this batch's students"
                          >
                            <div className="truncate text-sm font-medium">{b.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {b.studentCount} student{b.studentCount === 1 ? "" : "s"}
                              {b.isArchived ? " · archived" : ""}
                            </div>
                            {batchEnrollmentSummary(b) && (
                              <div className="text-muted-foreground truncate text-[11px]">{batchEnrollmentSummary(b)}</div>
                            )}
                          </button>
                          {!b.isArchived && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Start date, seats and waiting list"
                              onClick={() => setSettingsId(settingsId === b.id ? null : b.id)}
                            >
                              <SettingsIcon className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Rename"
                            onClick={() => {
                              setRenameId(b.id)
                              setRenameValue(b.name)
                            }}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={b.isArchived ? "Restore" : "Archive"}
                            onClick={() => updateBatch({ variables: { id: b.id, isArchived: !b.isArchived } })}
                          >
                            {b.isArchived ? (
                              <ArchiveRestoreIcon className="size-4" />
                            ) : (
                              <ArchiveIcon className="size-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                    {settingsId === b.id && !b.isArchived && (
                      <BatchEnrollmentPanel key={b.id} batch={b} onSaved={refreshAll} />
                    )}
                    </li>
                  ))}
                </ul>
              )}
              {activeBatches.length >= 2 &&
                (mergeOpen ? (
                  <div className="space-y-3 rounded-2xl border p-3">
                    <div className="text-sm font-medium">Merge batches</div>
                    <label className="block text-xs">
                      <span className="text-muted-foreground mb-1 block">Keep this batch</span>
                      <select
                        value={mergeInto}
                        onChange={(e) => setMergeInto(e.target.value)}
                        className={cn(selectCls, "w-full")}
                      >
                        <option value="">Choose…</option>
                        {activeBatches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {mergeInto && (
                      <fieldset className="space-y-1.5">
                        <legend className="text-muted-foreground mb-1 text-xs">Move all their students into it</legend>
                        {activeBatches
                          .filter((b) => b.id !== mergeInto)
                          .map((b) => (
                            <label key={b.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={mergeFrom.has(b.id)}
                                onChange={() => toggleMergeFrom(b.id)}
                              />
                              {b.name}
                              <span className="text-muted-foreground text-xs">({b.studentCount})</span>
                            </label>
                          ))}
                      </fieldset>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Their recordings stay visible to the moved students, and the emptied batches are archived.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={closeMerge}>
                        Cancel
                      </Button>
                      <Button
                        variant="brand-secondary"
                        size="sm"
                        disabled={merging || !mergeInto || ![...mergeFrom].some((id) => id !== mergeInto)}
                        onClick={submitMerge}
                      >
                        {merging ? <Loader2Icon className="size-4 animate-spin" /> : "Merge"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setMergeOpen(true)}>
                    <CombineIcon className="size-4" />
                    Merge batches
                  </Button>
                ))}
              <p className="text-muted-foreground text-xs">
                Archiving hides a batch from pickers; students and recordings keep it.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/70 overflow-hidden rounded-3xl backdrop-blur">
            <CardContent className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">Students</h2>
                  <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className={selectCls}>
                    <option value="all">All ({roster.length})</option>
                    <option value="none">Without a batch ({unassigned})</option>
                    {allBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selected.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{selected.size} selected → move to</span>
                    <select value={bulkBatch} onChange={(e) => setBulkBatch(e.target.value)} className={selectCls}>
                      <option value={NO_BATCH}>No batch</option>
                      {activeBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="brand-secondary"
                      size="sm"
                      disabled={moving}
                      onClick={() => moveStudents([...selected], bulkBatch)}
                    >
                      {moving ? <Loader2Icon className="size-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
              </div>

              {rosterQuery.loading && !rosterQuery.data ? (
                <div className="text-muted-foreground flex justify-center py-12">
                  <Loader2Icon className="size-6 animate-spin" />
                </div>
              ) : visibleRoster.length === 0 ? (
                <div className="text-muted-foreground py-12 text-center">
                  <UsersRoundIcon className="mx-auto mb-3 size-10 opacity-50" />
                  {roster.length === 0
                    ? "No students are enrolled in this course yet."
                    : "No students match this filter."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted-surface/40 border-b">
                      <tr>
                        <th className="w-10 p-4">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleAllVisible}
                            aria-label="Select all"
                          />
                        </th>
                        <th className="p-4 font-semibold">Student</th>
                        <th className="p-4 font-semibold">Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRoster.map((s) => {
                        const currentArchived = s.batchId && !activeBatches.some((b) => b.id === s.batchId)
                        return (
                          <tr key={s.id} className="hover:bg-muted-surface/20 border-b transition-colors">
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selected.has(s.id)}
                                onChange={() => toggle(s.id)}
                                aria-label={`Select ${s.fullName || s.email}`}
                              />
                            </td>
                            <td className="p-4">
                              <div className="font-medium">{s.fullName || "—"}</div>
                              <div className="text-muted-foreground text-xs">{s.email}</div>
                            </td>
                            <td className="p-4">
                              <select
                                value={s.batchId ?? NO_BATCH}
                                onChange={(e) => moveStudents([s.id], e.target.value)}
                                className={cn(selectCls, !s.batchId && "text-muted-foreground")}
                                disabled={moving}
                              >
                                <option value={NO_BATCH}>No batch</option>
                                {currentArchived && (
                                  <option value={s.batchId!}>{batchName(s.batchId)} (archived)</option>
                                )}
                                {activeBatches.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
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
