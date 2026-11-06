"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import toast from "react-hot-toast"
import {
  AwardIcon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardListIcon,
  ClockIcon,
  ListTodoIcon,
  Loader2Icon,
  PlayCircleIcon,
  PlayIcon,
  UserCheckIcon,
} from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { CONFIG } from "@/utils/constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/useable-components/card"
import { ProgressRing } from "@/lib/ui/useable-components/progress-ring"
import { parseDate, formatTime } from "@/lib/helpers"
import { JOIN_LECTURE, GET_CONTINUE_WATCHING, GET_MY_ATTENDANCE_SUMMARIES, GET_MY_PROGRESS, GET_UPCOMING_LECTURES } from "@/lib/graphql"
import { RecordingPlayerDialog, formatClock } from "@/lib/ui/useable-components/recording-player"
import { WatchedBar, watchedPercent, type RecordingProgress } from "@/lib/ui/screens/student/recordings"
import { useUser } from "@/lib/providers/user"
import { PushNotificationsBanner } from "@/lib/ui/useable-components/push-notifications"

/** Must match the API: the class opens this many minutes before it starts. */
const JOIN_EARLY_MINUTES = 10

type LectureApi = {
  id: string
  courseName?: string | null
  title: string
  meetUrl?: string | null
  durationMins: number
  startAt: string
}

/** Points a tab we opened at the class link, cut off from this page. */
function sendTabTo(tab: Window, url: string) {
  tab.opener = null
  tab.location.href = url
}

export const StudentMyLecturesScreen = () => {
  const [now, setNow] = useState<number>(() => Date.now())
  const { userProfileInfo } = useUser()
  const { data: lectureData, loading: loadingLectures, error: lectureError } = useQuery<{
    getUpcomingLectures: LectureApi[]
  }>(GET_UPCOMING_LECTURES)
  const { data: progressData, loading: loadingProgress, error: progressError } = useQuery<{
    getMyProgress: {
      enrolledCoursesCount: number
      publishedQuizzesTotal: number
      quizzesAttempted: number
      quizzesPassed: number
      publishedAssignmentsTotal: number
      assignmentsSubmitted: number
      assignmentsGraded: number
      assignmentsPendingReview: number
      averageMarksPercent: number | null
      courses: Array<{
        courseId: string
        courseTitle: string
        courseSlug: string
        progressPercent: number
        quizzesTotal: number
        quizzesAttempted: number
        assignmentsTotal: number
        assignmentsSubmitted: number
        assignmentsPendingReview: number
      }>
    }
  }>(GET_MY_PROGRESS, { skip: !userProfileInfo?.id, fetchPolicy: "network-only" })

  const { data: attendanceData } = useQuery<{
    getMyAttendanceSummaries: Array<{
      courseId: string
      courseTitle: string | null
      courseSlug: string | null
      sessionsTaken: number
      presentCount: number
      percentage: number | null
    }>
  }>(GET_MY_ATTENDANCE_SUMMARIES, { skip: !userProfileInfo?.id, fetchPolicy: "network-only" })

  const { data: continueData, refetch: refetchContinue } = useQuery<{
    getContinueWatching: Array<{
      recording: { id: string; title: string; durationSeconds: number | null; course?: { title?: string | null } | null }
      progress: RecordingProgress
    }>
  }>(GET_CONTINUE_WATCHING, { variables: { limit: 3 }, skip: !userProfileInfo?.id, fetchPolicy: "network-only" })
  const continueItems = continueData?.getContinueWatching ?? []
  const [playing, setPlaying] = useState<{ id: string; title: string; startAt: number } | null>(null)

  const [joinLecture] = useMutation<{ joinLecture: { meetUrl: string; attendanceStatus: string | null } }>(JOIN_LECTURE)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  /** Opens the class and marks attendance. The tab opens first so popup blockers allow it. */
  const joinClass = async (lectureId: string) => {
    const tab = window.open("", "_blank")
    setJoiningId(lectureId)
    try {
      const { data } = await joinLecture({ variables: { lectureId } })
      const url = data?.joinLecture.meetUrl
      if (!url) throw new Error("The class link isn't available.")
      if (tab) {
        sendTabTo(tab, url)
      } else {
        window.location.assign(url)
      }
      const status = data?.joinLecture.attendanceStatus
      if (status === "PRESENT") toast.success("You're marked present.")
      else if (status === "LATE") toast("Joined late: you're marked late.")
    } catch (e) {
      tab?.close()
      toast.error(e instanceof Error ? e.message : "Couldn't join the class.")
    } finally {
      setJoiningId(null)
    }
  }

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const progress = progressData?.getMyProgress
  const attendanceSummaries = useMemo(() => attendanceData?.getMyAttendanceSummaries ?? [], [attendanceData])
  const overallAttendance = useMemo(() => {
    const withPct = attendanceSummaries.filter((s) => s.percentage != null && s.sessionsTaken > 0)
    if (!withPct.length) return null
    const sum = withPct.reduce((a, s) => a + (s.percentage ?? 0), 0)
    return Math.round(sum / withPct.length)
  }, [attendanceSummaries])
  const overallPercent = useMemo(() => {
    if (!progress?.courses.length) return 0
    const sum = progress.courses.reduce((a, c) => a + c.progressPercent, 0)
    return Math.round(sum / progress.courses.length)
  }, [progress])

  const upcoming = useMemo(() => {
    const list = lectureData?.getUpcomingLectures ?? []
    return list.map((l) => ({
      id: l.id,
      course: l.courseName ?? "Course",
      title: l.title,
      meetUrl: l.meetUrl,
      durationMins: l.durationMins ?? 60,
      startAt: l.startAt,
    }))
  }, [lectureData?.getUpcomingLectures])

  const toCountdown = (startAtMs: number) => {
    const diff = Math.max(0, startAtMs - now)
    const total = Math.floor(diff / 1000)
    const hrs = Math.floor(total / 3600)
    const mins = Math.floor((total % 3600) / 60)
    const secs = total % 60
    return { hrs, mins, secs, isLive: diff === 0 }
  }

  const firstName = userProfileInfo?.fullName?.split(" ")[0] ?? "Student"

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">My Dashboard</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          Your real progress across quizzes and assignments — updated from your actual submissions and attempts.
        </p>
      </div>

      <PushNotificationsBanner />

      {loadingProgress ? (
        <div className="mb-8 flex items-center gap-2 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          Loading progress…
        </div>
      ) : progressError ? (
        <div className="mb-8 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Could not load your progress stats. Please refresh and try again.
        </div>
      ) : progress ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardDescription>Overall progress</CardDescription>
                <div className="flex items-center gap-3">
                  <ProgressRing value={overallPercent} size={56} strokeWidth={4}>
                    <span className="text-sm font-bold">{overallPercent}%</span>
                  </ProgressRing>
                  <CardTitle className="text-2xl">{overallPercent}%</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                {progress.enrolledCoursesCount} enrolled course{progress.enrolledCoursesCount !== 1 ? "s" : ""}
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <ClipboardListIcon className="size-3.5" /> Quizzes
                </CardDescription>
                <CardTitle className="text-2xl">
                  {progress.quizzesAttempted}/{progress.publishedQuizzesTotal}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                {progress.quizzesPassed} passed · {Math.max(0, progress.publishedQuizzesTotal - progress.quizzesAttempted)} remaining
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <ListTodoIcon className="size-3.5" /> Assignments
                </CardDescription>
                <CardTitle className="text-2xl">
                  {progress.assignmentsSubmitted}/{progress.publishedAssignmentsTotal}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                {progress.assignmentsPendingReview} pending review · {progress.assignmentsGraded} graded
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <AwardIcon className="size-3.5" /> Average score
                </CardDescription>
                <CardTitle className="text-2xl">
                  {progress.averageMarksPercent != null ? `${progress.averageMarksPercent}%` : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">From graded quizzes &amp; assignments</CardContent>
            </Card>
            <Link href={CONFIG.ROUTES.STUDENT.ATTENDANCE}>
              <Card className="rounded-2xl transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <UserCheckIcon className="size-3.5" /> Attendance
                  </CardDescription>
                  <CardTitle className="text-2xl">
                    {overallAttendance != null ? `${overallAttendance}%` : "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-xs">
                  80% required for certificate · view details
                </CardContent>
              </Card>
            </Link>
          </div>

          {progress.courses.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">Progress by course</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {progress.courses.map((c) => (
                  <Link key={c.courseId} href={`/student/course/${c.courseSlug}`}>
                    <Card className="transition-all hover:shadow-md">
                      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-base">{c.courseTitle}</CardTitle>
                          <CardDescription className="text-xs">
                            Quizzes {c.quizzesAttempted}/{c.quizzesTotal} · Assignments {c.assignmentsSubmitted}/
                            {c.assignmentsTotal}
                            {c.assignmentsPendingReview > 0 ? ` · ${c.assignmentsPendingReview} pending` : ""}
                          </CardDescription>
                        </div>
                        <ProgressRing value={c.progressPercent} size={44} strokeWidth={3}>
                          <span className="text-[10px] font-bold">{c.progressPercent}%</span>
                        </ProgressRing>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : userProfileInfo?.id ? (
        <div className="text-muted-foreground mb-8 rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
          No progress data yet. Enroll in a course to see quizzes and assignments here.
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={CONFIG.ROUTES.STUDENT.QUIZZES} className="rounded-2xl border p-4 transition-all hover:shadow-md">
          <ClipboardListIcon className="text-(--brand-secondary) mb-2 size-5" />
          <div className="font-semibold text-sm">My Quizzes</div>
          <div className="text-muted-foreground mt-1 text-xs">
            {progress
              ? `${progress.quizzesAttempted}/${progress.publishedQuizzesTotal} attempted · ${progress.quizzesPassed} passed`
              : loadingProgress
                ? "Loading…"
                : "Open quiz list"}
          </div>
        </Link>
        <Link href={CONFIG.ROUTES.STUDENT.ASSIGNMENTS} className="rounded-2xl border p-4 transition-all hover:shadow-md">
          <ListTodoIcon className="text-(--brand-secondary) mb-2 size-5" />
          <div className="font-semibold text-sm">My Assignments</div>
          <div className="text-muted-foreground mt-1 text-xs">
            {progress
              ? `${progress.assignmentsSubmitted}/${progress.publishedAssignmentsTotal} submitted · ${progress.assignmentsPendingReview} pending`
              : loadingProgress
                ? "Loading…"
                : "Open assignment list"}
          </div>
        </Link>
        <Link href={CONFIG.ROUTES.STUDENT.ATTENDANCE} className="rounded-2xl border p-4 transition-all hover:shadow-md">
          <UserCheckIcon className="text-(--brand-secondary) mb-2 size-5" />
          <div className="font-semibold text-sm">Attendance</div>
          <div className="text-muted-foreground mt-1 text-xs">
            {overallAttendance != null
              ? `${overallAttendance}% overall · 80% needed for certificate`
              : "View attendance by course"}
          </div>
        </Link>
        <Link href={CONFIG.ROUTES.STUDENT.MARKS} className="rounded-2xl border p-4 transition-all hover:shadow-md">
          <AwardIcon className="text-(--brand-secondary) mb-2 size-5" />
          <div className="font-semibold text-sm">My Marks</div>
          <div className="text-muted-foreground mt-1 text-xs">
            {progress
              ? progress.averageMarksPercent != null
                ? `Average ${progress.averageMarksPercent}% · ${progress.assignmentsGraded} graded`
                : `${progress.assignmentsGraded} graded so far`
              : loadingProgress
                ? "Loading…"
                : "View graded work"}
          </div>
        </Link>
        <Link href={CONFIG.ROUTES.STUDENT.MY_ENROLLED_COURSES} className="rounded-2xl border p-4 transition-all hover:shadow-md">
          <BookOpenIcon className="text-(--brand-secondary) mb-2 size-5" />
          <div className="font-semibold text-sm">My Courses</div>
          <div className="text-muted-foreground mt-1 text-xs">
            {progress
              ? `${progress.enrolledCoursesCount} enrolled · ${overallPercent}% overall`
              : loadingProgress
                ? "Loading…"
                : "Browse enrolled courses"}
          </div>
        </Link>
      </div>

      {continueItems.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Continue watching</h2>
            <Link href={CONFIG.ROUTES.STUDENT.RECORDINGS} className="text-sm font-medium text-(--brand-primary) hover:underline">
              All recordings
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {continueItems.map(({ recording: r, progress: p }) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setPlaying({ id: r.id, title: r.title, startAt: p.positionSeconds })}
                className="group flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{r.title}</div>
                    <div className="text-muted-foreground truncate text-xs">{r.course?.title}</div>
                  </div>
                  <PlayCircleIcon className="text-(--brand-primary) size-6 shrink-0 transition group-hover:scale-110" />
                </div>
                <WatchedBar percent={watchedPercent(p, r.durationSeconds)} />
                <div className="text-muted-foreground text-xs">Continue from {formatClock(p.positionSeconds)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Upcoming lectures</h2>
          <span className="text-muted-foreground max-w-md text-right text-sm">Next scheduled class per enrolled course</span>
        </div>
        {loadingLectures ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2Icon className="size-6 animate-spin" />
            Loading lectures…
          </div>
        ) : lectureError ? (
          <div className="py-12 text-center text-destructive">Failed to load lectures.</div>
        ) : upcoming.length === 0 ? (
          <div className="text-muted-foreground rounded-3xl border border-dashed py-12 text-center">No upcoming lectures scheduled.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((l) => {
              const startAtMs = parseDate(l.startAt)?.getTime() ?? 0
              const c = toCountdown(startAtMs)
              const startsAt = startAtMs ? new Date(startAtMs) : null
              const endMs = startAtMs + l.durationMins * 60_000
              const isOpen = startAtMs > 0 && now >= startAtMs - JOIN_EARLY_MINUTES * 60_000 && now <= endMs
              const opensIn = toCountdown(startAtMs - JOIN_EARLY_MINUTES * 60_000)
              return (
                <Card key={l.id} className="rounded-3xl">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-lg">{l.title}</CardTitle>
                    <CardDescription>{l.course}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border p-3 text-sm">
                        <div className="text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="size-3.5" /> Starts
                        </div>
                        <div className="mt-1 font-semibold">{formatTime(startsAt ?? l.startAt).split(":").slice(0, 2).join(":")}</div>
                      </div>
                      <div className="rounded-xl border p-3 text-sm">
                        <div className="text-muted-foreground flex items-center gap-1">
                          <ClockIcon className="size-3.5" /> Countdown
                        </div>
                        <div className="mt-1 font-semibold">
                          {c.isLive ? (now <= endMs ? "Live now" : "Ended") : `${c.hrs}h ${c.mins}m ${c.secs}s`}
                        </div>
                      </div>
                    </div>
                    {!l.meetUrl ? (
                      <Button variant="outline" shape="pill" className="w-full" disabled>
                        Meet link not set yet
                      </Button>
                    ) : isOpen ? (
                      <Button
                        variant="brand-secondary"
                        shape="pill"
                        className="w-full"
                        disabled={joiningId === l.id}
                        onClick={() => void joinClass(l.id)}
                      >
                        {joiningId === l.id ? <Loader2Icon className="size-4 animate-spin" /> : <PlayIcon className="size-4" />}
                        Join live class
                      </Button>
                    ) : (
                      <Button variant="outline" shape="pill" className="w-full" disabled>
                        Opens in {opensIn.hrs > 0 ? `${opensIn.hrs}h ` : ""}
                        {opensIn.mins}m {opensIn.secs}s
                      </Button>
                    )}
                    {isOpen && (
                      <p className="text-muted-foreground text-center text-xs">Joining from here marks your attendance.</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <RecordingPlayerDialog
        recordingId={playing?.id ?? null}
        title={playing?.title ?? ""}
        startAt={playing?.startAt ?? null}
        onClose={() => {
          setPlaying(null)
          window.setTimeout(() => void refetchContinue(), 600)
        }}
      />
    </div>
  )
}
