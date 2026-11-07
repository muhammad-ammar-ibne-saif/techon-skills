"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@apollo/client/react"
import { AwardIcon, Loader2Icon, TrendingUpIcon } from "lucide-react"
import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/lib/ui/useable-components/chart"
import { GET_MY_COURSE_ASSIGNMENTS, GET_MY_MARKS_SUMMARY } from "@/lib/graphql"
import { formatDateLong } from "@/lib/helpers"
import { useCourses } from "@/lib/providers/courses"
import { cn } from "@/lib/helpers"

type SubmissionItem = {
  id: string
  courseId: string
  type: string
  referenceId: string
  title: string
  mcqScore: number | null
  mcqMax: number | null
  marks: number | null
  maxMarks: number
  status: string
  markedAt: string | null
  feedback?: string
  createdAt: string
  canStudentSubmit: boolean
}

const PASSING_PERCENT = 50

export const StudentMarksScreen = () => {
  const searchParams = useSearchParams()
  const pendingOnly = searchParams.get("filter") === "pending"

  const { data, loading } = useQuery<{
    getMyMarksSummary: {
      totalSubmissions: number
      markedCount: number
      averageMarks: number | null
      submissions: SubmissionItem[]
    }
  }>(GET_MY_MARKS_SUMMARY)

  const { data: assignData } = useQuery<{
    getMyCourseAssignments: Array<{ id: string; courseId: string; referenceId: string }>
  }>(GET_MY_COURSE_ASSIGNMENTS, { fetchPolicy: "network-only" })

  const assignmentIdByRef = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of assignData?.getMyCourseAssignments ?? []) {
      map.set(`${a.courseId}:${a.referenceId}`, a.id)
    }
    return map
  }, [assignData?.getMyCourseAssignments])

  const { courses } = useCourses()
  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id

  const summary = data?.getMyMarksSummary
  const submissions = summary?.submissions ?? []
  const tableSubmissions = useMemo(
    () => (pendingOnly ? submissions.filter((s) => s.status === "submitted") : submissions),
    [submissions, pendingOnly]
  )
  const marked = submissions.filter(
    (s) =>
      s.status === "marked" &&
      s.marks != null &&
      s.maxMarks > 0 &&
      Math.round((s.marks / s.maxMarks) * 100) >= PASSING_PERCENT
  )
  const pct = (s: SubmissionItem) => (s.maxMarks > 0 && s.marks != null ? Math.round((s.marks / s.maxMarks) * 100) : 0)
  const isPassed = (s: SubmissionItem) => s.status === "marked" && s.maxMarks > 0 && s.marks != null && pct(s) >= PASSING_PERCENT
  const isNotPassed = (s: SubmissionItem) =>
    s.status === "marked" && s.maxMarks > 0 && (s.marks == null || pct(s) < PASSING_PERCENT)

  const chartData = useMemo(
    () =>
      marked
        .map((s) => ({
          title: s.title.length > 20 ? s.title.slice(0, 18) + "…" : s.title,
          fullTitle: s.title,
          marks: s.marks ?? 0,
          pct: pct(s),
        }))
        .reverse(),
    [marked]
  )

  const marksChartConfig = {
    marks: { label: "Marks %", color: "var(--chart-1)" },
  } satisfies ChartConfig

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2Icon className="size-10 animate-spin text-(--brand-highlight)" />
      </div>
    )
  }

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">My Marks</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Marks & performance
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          View your marks for graded exercises and assignments. You&apos;ll be notified when an instructor has marked your submission.
        </p>
        {pendingOnly && (
          <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100">
            Showing items still awaiting marks. Clear <span className="font-mono">?filter=pending</span> from the URL to see everything.
          </p>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="bg-background/70 backdrop-blur rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AwardIcon className="size-5" />
              <span className="text-xs font-medium">Total submitted</span>
            </div>
            <div className="text-2xl font-bold">{summary?.totalSubmissions ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/70 backdrop-blur rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUpIcon className="size-5" />
              <span className="text-xs font-medium">Marked</span>
            </div>
            <div className="text-2xl font-bold">{summary?.markedCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/70 backdrop-blur rounded-3xl">
          <CardContent className="p-6">
            <div className="text-muted-foreground text-xs font-medium mb-1">Average marks</div>
            <div className="text-2xl font-bold">
              {summary?.averageMarks != null
                ? `${Math.round(summary.averageMarks)}%`
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="bg-background/70 backdrop-blur rounded-3xl mb-8">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Marks by assignment / exercise</h2>
            <ChartContainer config={marksChartConfig} className="h-[280px] w-full">
              <BarChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 24 }}>
                <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltipContent
                      active={active}
                      payload={payload ? [...payload] : []}
                      label={
                        ((payload?.[0]?.payload as { fullTitle?: string })?.fullTitle ?? label) != null
                          ? String((payload?.[0]?.payload as { fullTitle?: string })?.fullTitle ?? label)
                          : undefined
                      }
                      formatter={(v) => `${Number(v)}%`}
                    />
                  )}
                  cursor={false}
                />
                <Bar dataKey="pct" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card className="bg-background/70 backdrop-blur rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted-surface/40">
                <tr>
                  <th className="p-4 font-semibold">Course / Title</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Marks</th>
                  <th className="p-4 font-semibold">Submitted</th>
                  <th className="p-4 font-semibold">Marked at</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {tableSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {pendingOnly
                        ? "No submissions waiting for marks."
                        : "No submissions yet. Complete graded exercises or assignments to see marks here."}
                    </td>
                  </tr>
                ) : (
                  tableSubmissions.map((s) => {
                    const assignmentId =
                      s.type === "assignment"
                        ? assignmentIdByRef.get(`${s.courseId}:${s.referenceId}`)
                        : undefined
                    const canResubmit = s.type === "assignment" && s.canStudentSubmit && assignmentId
                    return (
                      <tr key={s.id} className="border-b transition-colors hover:bg-muted-surface/20">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{s.title}</div>
                            <div className="text-muted-foreground text-xs">{courseTitle(s.courseId)}</div>
                            {s.status === "marked" && s.feedback ? (
                              <p className="mt-1 max-w-md whitespace-pre-wrap text-xs">
                                <span className="font-medium">Feedback:</span> {s.feedback}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-4 capitalize">{s.type.replace("_", " ")}</td>
                        <td className="p-4">
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-xs font-medium",
                              isPassed(s)
                                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                : canResubmit
                                  ? "bg-sky-500/20 text-sky-700 dark:text-sky-400"
                                  : isNotPassed(s)
                                    ? "bg-red-500/20 text-red-600 dark:text-red-400"
                                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {isPassed(s)
                              ? "Passed"
                              : canResubmit
                                ? "Re-attempt allowed"
                                : isNotPassed(s)
                                  ? "Not passed"
                                  : "Pending"}
                          </span>
                        </td>
                        <td className="p-4">
                          {s.status === "marked" && s.marks != null
                            ? `${s.marks} / ${s.maxMarks}`
                            : "—"}
                        </td>
                        <td className="p-4 text-muted-foreground">{formatDateLong(s.createdAt)}</td>
                        <td className="p-4 text-muted-foreground">
                          {s.markedAt ? formatDateLong(s.markedAt) : "—"}
                        </td>
                        <td className="p-4">
                          {canResubmit ? (
                            <Button asChild variant="brand-secondary" size="sm" shape="pill">
                              <Link href={`/student/assignments/${assignmentId}`}>Resubmit</Link>
                            </Button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
