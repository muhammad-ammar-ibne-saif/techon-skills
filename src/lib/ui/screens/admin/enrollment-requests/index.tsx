"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useQuery, useMutation } from "@apollo/client/react"
import {
  SearchIcon,
  CheckCircle2Icon,
  Loader2Icon,
  BookOpenIcon,
  UserIcon,
  BanknoteIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  XCircleIcon,
  ExternalLinkIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { cn, getApiDisplayMessage, formatDateTime, getImageSrc } from "@/lib/helpers"
import { apiService } from "@/lib/services/api"
import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/lib/ui/useable-components/sheet"
import { SheetContentSide } from "@/utils/enums"
import { GET_COURSE_ENROLLMENT_REQUESTS, ENROLL_USER_IN_COURSE } from "@/lib/graphql"
import type { IEnrollmentApplication, EnrollmentApplicationStatus } from "@/utils/interfaces"

type CourseEnrollmentRequest = {
  userId: string
  courseId: string
  user: { id: string; email: string; fullName: string | null }
  course: {
    id: string
    title: string
    slug: string
    feePerMonth: number
    totalNumberOfInstallments: number
    totalFee: number
    currency: string
  }
}

const APP_PAGE_SIZE = 10

export const AdminEnrollmentRequestsScreen = () => {
  const [panel, setPanel] = useState<"applications" | "courses">("applications")

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">Admin</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Enrollment requests</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          Review public enrollment applications (fee proof and course choices), or approve course requests from students who
          already have accounts.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={panel === "applications" ? "brand-secondary" : "outline"}
          size="sm"
          shape="pill"
          onClick={() => setPanel("applications")}
          className="gap-2"
        >
          <ClipboardListIcon className="size-4" />
          Public applications
        </Button>
        <Button
          type="button"
          variant={panel === "courses" ? "brand-secondary" : "outline"}
          size="sm"
          shape="pill"
          onClick={() => setPanel("courses")}
          className="gap-2"
        >
          <GraduationCapIcon className="size-4" />
          In-app course requests
        </Button>
      </div>

      {panel === "applications" ? <PublicEnrollmentApplicationsPanel /> : <CourseEnrollmentRequestsPanel />}
    </div>
  )
}

function PublicEnrollmentApplicationsPanel() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<EnrollmentApplicationStatus | "all">("pending")
  const [page, setPage] = useState(1)
  const [applications, setApplications] = useState<IEnrollmentApplication[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectApp, setRejectApp] = useState<IEnrollmentApplication | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    const statusParam = statusFilter === "all" ? undefined : statusFilter
    const res = await apiService.getEnrollmentApplications(page, APP_PAGE_SIZE, statusParam)
    if (res.success && res.data) {
      setApplications(res.data)
      setTotal(res.total)
    } else {
      setApplications([])
      if (res.total !== undefined) setTotal(res.total)
      if (!res.success) toast.error(getApiDisplayMessage(res, "Failed to load enrollment applications."))
    }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => {
    queueMicrotask(() => fetchApplications())
  }, [fetchApplications])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return applications
    const q = searchQuery.toLowerCase()
    return applications.filter(
      (a) =>
        a.email.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        a.courses.some((c) => c.title.toLowerCase().includes(q))
    )
  }, [applications, searchQuery])

  const handleApprove = async (app: IEnrollmentApplication) => {
    setActionId(app._id)
    const res = await apiService.approveEnrollmentApplication(app._id)
    setActionId(null)
    if (res.success) {
      toast.success(getApiDisplayMessage(res, "Application approved. Student account is active and enrolled in selected courses."))
      fetchApplications()
    } else {
      toast.error(getApiDisplayMessage(res, "Could not approve this application."))
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectApp) return
    setActionId(rejectApp._id)
    const res = await apiService.rejectEnrollmentApplication(rejectApp._id, rejectReason.trim() || undefined)
    setActionId(null)
    if (res.success) {
      toast.success(getApiDisplayMessage(res, "Application rejected. The applicant has been notified by email."))
      setRejectApp(null)
      setRejectReason("")
      fetchApplications()
    } else {
      toast.error(getApiDisplayMessage(res, "Could not reject this application."))
    }
  }

  const countLabel =
    statusFilter === "all"
      ? "Total (this page filter)"
      : statusFilter === "pending"
        ? "Pending"
        : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(70,208,255,0.20),rgba(255,138,61,0.10),transparent_70%)] p-px">
          <Card className="bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60 rounded-3xl">
            <CardContent className="p-6">
              <div className="text-muted-foreground text-xs mb-1">{countLabel}</div>
              <div className="text-3xl font-semibold tracking-tight text-(--brand-primary)">
                {loading ? "—" : total ?? "—"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, phone, or course…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant={statusFilter === s ? "brand-secondary" : "outline"}
              size="sm"
              shape="pill"
              onClick={() => {
                setStatusFilter(s)
                setPage(1)
              }}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(70,208,255,0.25),rgba(255,138,61,0.12),transparent_70%)] p-px">
        <Card className="bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2Icon className="size-6 animate-spin" />
                <span>Loading applications…</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-border border-b bg-background/40">
                    <tr>
                      <th className="p-4 font-semibold">Applicant</th>
                      <th className="p-4 font-semibold">Courses</th>
                      <th className="p-4 font-semibold">Submitted</th>
                      <th className="p-4 font-semibold">Proof</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((app) => {
                      const busy = actionId === app._id
                      const proofUrl = getImageSrc(app.feePaymentScreenshotRelativePath)
                      return (
                        <tr key={app._id} className="border-border border-b transition-colors hover:bg-background/60">
                          <td className="p-4 align-top">
                            <div className="font-medium">{app.name}</div>
                            <div className="text-muted-foreground text-xs">{app.email}</div>
                            <div className="text-muted-foreground text-xs">{app.phone}</div>
                          </td>
                          <td className="p-4 align-top">
                            <ul className="list-inside list-disc text-xs text-muted-foreground">
                              {app.courses.map((c) => (
                                <li key={c.slug}>{c.title}</li>
                              ))}
                            </ul>
                            <div className="mt-1.5 text-xs font-medium">
                              {app.paymentPlan === "FULL"
                                ? "Full payment"
                                : app.paymentPlan === "MORE_INSTALLMENTS"
                                  ? `Asks for ${app.requestedInstallments ?? "?"} installments`
                                  : "2 installments"}
                            </div>
                          </td>
                          <td className="p-4 align-top text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(app.createdAt)}
                          </td>
                          <td className="p-4 align-top">
                            <a
                              href={proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-(--brand-primary) dark:text-(--text-primary-dark) inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                            >
                              <ExternalLinkIcon className="size-3.5" />
                              View
                            </a>
                          </td>
                          <td className="p-4 align-top">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                app.status === "pending" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                                app.status === "approved" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                                app.status === "rejected" && "bg-destructive/15 text-destructive"
                              )}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4 align-top">
                            {app.status === "pending" ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="brand-secondary"
                                  size="sm"
                                  shape="pill"
                                  disabled={busy}
                                  onClick={() => handleApprove(app)}
                                >
                                  {busy ? <Loader2Icon className="size-4 animate-spin" /> : <CheckCircle2Icon className="size-4" />}
                                  <span className="ml-1">Approve</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  shape="pill"
                                  disabled={busy}
                                  onClick={() => {
                                    setRejectApp(app)
                                    setRejectReason("")
                                  }}
                                >
                                  <XCircleIcon className="size-4" />
                                  <span className="ml-1">Reject</span>
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                {applications.length === 0 ? "No enrollment applications yet." : "No rows match your search."}
              </div>
            )}
          </CardContent>
          {!loading && (applications.length > 0 || page > 1) && total != null && (
            <div className="border-border flex items-center justify-between border-t px-4 py-3">
              <div className="text-muted-foreground text-sm">
                Page {page} of {Math.max(1, Math.ceil(total / APP_PAGE_SIZE))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * APP_PAGE_SIZE >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Sheet open={!!rejectApp} onOpenChange={(o) => !o && setRejectApp(null)}>
        <SheetContent side={SheetContentSide.RIGHT} className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Reject application</SheetTitle>
            <SheetDescription>
              Optional note to include in the email to {rejectApp?.email}. Leave blank for a generic message.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (optional)"
              className="min-h-28 rounded-xl"
            />
          </div>
          <SheetFooter className="flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectApp(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!!actionId}
            >
              {actionId ? <Loader2Icon className="size-4 animate-spin" /> : null}
              <span className="ml-1">Send rejection</span>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

function CourseEnrollmentRequestsPanel() {
  const [searchQuery, setSearchQuery] = useState("")
  const [approvingKey, setApprovingKey] = useState<string | null>(null)

  const { data, loading, refetch } = useQuery<{ getCourseEnrollmentRequests: CourseEnrollmentRequest[] }>(
    GET_COURSE_ENROLLMENT_REQUESTS
  )
  const [enrollUserInCourse] = useMutation(ENROLL_USER_IN_COURSE, {
    onCompleted: () => {
      setApprovingKey(null)
      toast.success("Enrollment approved. Two installments were created; adjust them under Payments → Student fees if needed.")
      refetch()
    },
    onError: (e) => {
      setApprovingKey(null)
      toast.error(e.message ?? "Failed to approve enrollment.")
    },
  })

  const requests = data?.getCourseEnrollmentRequests ?? []
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests
    const q = searchQuery.toLowerCase()
    return requests.filter(
      (r) =>
        r.user.email.toLowerCase().includes(q) ||
        (r.user.fullName?.toLowerCase().includes(q) ?? false) ||
        r.course.title.toLowerCase().includes(q)
    )
  }, [requests, searchQuery])

  const handleApprove = (req: CourseEnrollmentRequest) => {
    const key = `${req.userId}-${req.courseId}`
    setApprovingKey(key)
    enrollUserInCourse({
      variables: {
        input: { userId: req.userId, courseId: req.courseId },
      },
    })
  }

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(70,208,255,0.20),rgba(255,138,61,0.10),transparent_70%)] p-px">
          <Card className="bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60 rounded-3xl">
            <CardContent className="p-6">
              <div className="text-muted-foreground text-xs mb-1">Open course requests</div>
              <div className="text-3xl font-semibold tracking-tight text-(--brand-primary)">
                {loading ? "—" : requests.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by student name, email, or course…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(70,208,255,0.25),rgba(255,138,61,0.12),transparent_70%)] p-px">
        <Card className="bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2Icon className="size-6 animate-spin" />
                <span>Loading course requests…</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-border border-b bg-background/40">
                    <tr>
                      <th className="p-4 font-semibold">Student</th>
                      <th className="p-4 font-semibold">Course</th>
                      <th className="p-4 font-semibold">Fee (from course)</th>
                      <th className="p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => {
                      const key = `${req.userId}-${req.courseId}`
                      const isApproving = approvingKey === key
                      const feeLabel = `${req.course.currency} ${req.course.totalFee?.toLocaleString() ?? 0} (2 installments)`
                      return (
                        <tr
                          key={key}
                          className="border-border border-b transition-colors hover:bg-background/60 animate-in fade-in slide-in-from-bottom-2 duration-500"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <UserIcon className="size-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{req.user.fullName || "—"}</div>
                                <div className="text-muted-foreground text-xs">{req.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <BookOpenIcon className="size-4 text-muted-foreground" />
                              <span>{req.course.title}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <BanknoteIcon className="size-4 text-muted-foreground" />
                              <span className="text-muted-foreground text-xs">{feeLabel}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Button
                              type="button"
                              variant="brand-secondary"
                              size="sm"
                              shape="pill"
                              disabled={isApproving}
                              onClick={() => handleApprove(req)}
                            >
                              {isApproving ? (
                                <Loader2Icon className="size-4 animate-spin" />
                              ) : (
                                <CheckCircle2Icon className="size-4" />
                              )}
                              <span className="ml-2">{isApproving ? "Approving..." : "Approve"}</span>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && filteredRequests.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                {requests.length === 0 ? "No in-app course requests at the moment." : "No requests match your search."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
