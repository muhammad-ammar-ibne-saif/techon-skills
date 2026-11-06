"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@apollo/client/react"
import { Loader2Icon, MessageCircleQuestionIcon, PlayCircleIcon } from "lucide-react"

import { RecordingPlayerDialog } from "@/lib/ui/useable-components/recording-player"
import { QuestionCard, type QuestionItem } from "@/lib/ui/useable-components/recording-player/questions"
import { GET_COURSES, GET_QUESTIONS_FOR_STAFF } from "@/lib/graphql"
import { filterCoursesForGrader } from "@/lib/helpers/grader-courses"
import { getStaffEyebrow } from "@/lib/helpers"
import { useUser } from "@/lib/providers/user"

/** Staff inbox of students' questions under recordings, unanswered first. */
export const AdminQuestionsScreen = () => {
  const { userProfileInfo } = useUser()
  const [courseId, setCourseId] = useState("all")
  const [unansweredOnly, setUnansweredOnly] = useState(true)
  const [playing, setPlaying] = useState<{ id: string; title: string } | null>(null)

  const { data: coursesData } = useQuery<{ getCourses: Array<{ id: string; title: string; slug: string }> }>(GET_COURSES)
  const courses = useMemo(
    () => filterCoursesForGrader(coursesData?.getCourses ?? [], userProfileInfo?.role, userProfileInfo?.allowedMarkGradesOn),
    [coursesData, userProfileInfo?.role, userProfileInfo?.allowedMarkGradesOn]
  )

  const { data, loading, error, refetch } = useQuery<{ getQuestionsForStaff: QuestionItem[] }>(GET_QUESTIONS_FOR_STAFF, {
    variables: { courseId: courseId === "all" ? null : courseId, unansweredOnly },
    skip: !userProfileInfo?.id,
    fetchPolicy: "cache-and-network",
  })
  const questions = data?.getQuestionsForStaff ?? []

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">{getStaffEyebrow(userProfileInfo?.role)}</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Student questions</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          Questions students ask under lecture recordings. Your answer is marked as the instructor&apos;s and the student gets an
          email.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          aria-label="Course"
        >
          <option value="all">All my courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={unansweredOnly} onChange={(e) => setUnansweredOnly(e.target.checked)} />
          Waiting for an answer only
        </label>
      </div>

      {loading && !data ? (
        <div className="text-muted-foreground flex items-center gap-2 py-12">
          <Loader2Icon className="size-5 animate-spin" /> Loading questions…
        </div>
      ) : error ? (
        <div className="text-destructive py-12 text-center">{error.message}</div>
      ) : questions.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-3xl border border-dashed py-12 text-center">
          <MessageCircleQuestionIcon className="size-8" />
          {unansweredOnly ? "No questions waiting for an answer." : "No questions yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{q.courseTitle}</span>·
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-(--brand-primary) hover:underline"
                  onClick={() => setPlaying({ id: q.recordingId, title: q.recordingTitle ?? "Recording" })}
                >
                  <PlayCircleIcon className="size-3.5" /> {q.recordingTitle}
                </button>
              </div>
              <QuestionCard q={q} canModerate onDeleted={() => void refetch()} />
            </div>
          ))}
        </div>
      )}

      <RecordingPlayerDialog
        recordingId={playing?.id ?? null}
        title={playing?.title ?? ""}
        onClose={() => {
          setPlaying(null)
          void refetch()
        }}
      />
    </div>
  )
}
