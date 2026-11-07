"use client"

import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { ArrowLeftIcon, Loader2Icon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/useable-components/card"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { GET_COURSE_ASSIGNMENT_BY_ID, GET_SUBMISSIONS_FOR_ASSIGNMENT, SET_ASSIGNMENT_MARKING_GUIDE } from "@/lib/graphql"
import { SubmissionGradingBlock, type SubmissionRow } from "@/lib/ui/screens/admin/submissions/submission-grading-block"

function MarkingGuideEditor({ id, initial, onSaved }: { id: string; initial: string; onSaved: () => void }) {
  const [value, setValue] = useState(initial)
  const [save, { loading }] = useMutation(SET_ASSIGNMENT_MARKING_GUIDE)
  const changed = value.trim() !== initial.trim()
  const onSave = async () => {
    try {
      await save({ variables: { id, markingGuide: value } })
      toast.success("Marking guide saved.")
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the marking guide.")
    }
  }
  return (
    <div>
      <label className="text-muted-foreground mb-1 block text-xs font-medium">
        Marking guide (staff only). It shows next to each submission while you grade.
      </label>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={5000}
        placeholder="e.g. 4 for layout, 4 for working code, 2 for a README."
        className="min-h-[80px] resize-y"
      />
      <div className="mt-2 flex justify-end">
        <Button type="button" size="sm" shape="pill" variant="brand-secondary" disabled={!changed || loading} onClick={onSave}>
          {loading ? <Loader2Icon className="size-4 animate-spin" /> : "Save guide"}
        </Button>
      </div>
    </div>
  )
}

export const AdminAssignmentSubmissionsScreen = ({ assignmentId }: { assignmentId: string }) => {
  const { data: assignData, loading: loadingA, refetch: refetchAssignment } = useQuery<{
    getCourseAssignmentById: {
      id: string
      courseId: string
      title: string
      description: string | null
      maxMarks: number
      markingGuide: string | null
      referenceId: string
      dueDate: string | null
      course?: { id: string; title: string } | null
    } | null
  }>(GET_COURSE_ASSIGNMENT_BY_ID, {
    variables: { id: assignmentId },
    skip: !assignmentId,
    fetchPolicy: "network-only",
  })

  const assignment = assignData?.getCourseAssignmentById ?? null

  const { data: subData, loading: loadingS, refetch } = useQuery<{
    getSubmissionsForAssignment: SubmissionRow[]
  }>(GET_SUBMISSIONS_FOR_ASSIGNMENT, {
    variables: { assignmentId },
    skip: !assignmentId || !assignment,
    fetchPolicy: "network-only",
  })

  const submissions = subData?.getSubmissionsForAssignment ?? []
  const loadingList = assignment ? loadingS : loadingA

  if (!assignmentId) {
    return null
  }

  if (!loadingA && !assignment) {
    return (
      <div className="w-full py-10">
        <Button asChild variant="ghost" shape="pill" className="mb-6">
          <Link href="/admin/assignments">
            <ArrowLeftIcon className="size-4" />
            Back to assignments
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Assignment not found</CardTitle>
            <CardDescription>You may not have access or it was removed.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <Button asChild variant="ghost" shape="pill" className="mb-6">
        <Link href="/admin/assignments">
          <ArrowLeftIcon className="size-4" />
          Back to assignments
        </Link>
      </Button>

      {assignment ? (
        <Card className="bg-background/70 mb-8 rounded-3xl backdrop-blur">
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <CardDescription>
              {assignment.course?.title ?? "Course"} · Max {assignment.maxMarks} marks · Ref{" "}
              <span className="font-mono text-xs">{assignment.referenceId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment.description ? (
              <div className="text-muted-foreground text-sm whitespace-pre-wrap">{assignment.description}</div>
            ) : null}
            <MarkingGuideEditor
              key={`${assignment.id}:${assignment.markingGuide ?? ""}`}
              id={assignment.id}
              initial={assignment.markingGuide ?? ""}
              onSaved={() => {
                void refetchAssignment()
                void refetch()
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8 flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          Loading assignment…
        </div>
      )}

      <div className="mb-2 text-sm font-semibold text-secondary">Student submissions</div>
      <SubmissionGradingBlock
        submissions={submissions}
        loading={loadingList}
        emptyMessage="No students have submitted this assignment yet."
        refetch={refetch}
      />
    </div>
  )
}
