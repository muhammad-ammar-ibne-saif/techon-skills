"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { AwardIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { CertificateView, toCertificateViewData, type CertificateApiFields, type CertificateTemplateFields } from "@/lib/ui/useable-components/certificate-view"
import {
  CREATE_CERTIFICATE_TEMPLATE,
  DELETE_CERTIFICATE,
  DELETE_CERTIFICATE_TEMPLATE,
  GET_CERTIFICATE_TEMPLATES,
  GET_CERTIFICATES_ADMIN,
  GET_COURSES,
  GET_USERS,
  ISSUE_CERTIFICATE,
  PUBLISH_CERTIFICATE,
  UPDATE_CERTIFICATE_TEMPLATE,
} from "@/lib/graphql"
import { cn, formatDateLong } from "@/lib/helpers"

type Tab = "templates" | "issue" | "issued"

type TemplateRow = {
  id: string
  name: string
  titleLine: string
  subtitleLine: string
  bodyTemplate: string
  footerLine: string
  directorName: string
  directorTitle: string
  mentorName: string
  mentorTitle: string
  isDefault: boolean
}

type CertRow = {
  id: string
  verificationCode: string
  studentName: string
  courseName: string
  percentage: number
  grade: string
  message: string
  status: string
  issuedAt: string | null
  createdAt: string
  template?: CertificateTemplateFields | null
      details?: CertificateApiFields["details"]
}

const emptyTemplate = {
  name: "",
  titleLine: "Certificate of Completion",
  subtitleLine: "This is to certify that",
  bodyTemplate:
    "{{studentName}} has successfully completed {{courseName}} with an overall score of {{percentage}}% (Grade {{grade}}).",
  footerLine: "TechOn Skills",
  directorName: "",
  directorTitle: "Director, TechOn Skills",
  mentorName: "",
  mentorTitle: "Lead Mentor",
  isDefault: false,
}

export const AdminCertificatesScreen = () => {
  const [tab, setTab] = useState<Tab>("templates")
  const [editId, setEditId] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState(emptyTemplate)
  const [issueForm, setIssueForm] = useState({
    userId: "",
    courseId: "",
    templateId: "",
    message: "",
    status: "pending" as "pending" | "live",
    percentageOverride: "",
  })
  const [previewCert, setPreviewCert] = useState<CertRow | null>(null)

  const { data: tplData, loading: loadingTpl, refetch: refetchTpl } = useQuery<{
    getCertificateTemplates: TemplateRow[]
  }>(GET_CERTIFICATE_TEMPLATES, { fetchPolicy: "network-only" })
  const { data: certData, loading: loadingCert, refetch: refetchCert } = useQuery<{
    getCertificatesAdmin: CertRow[]
  }>(GET_CERTIFICATES_ADMIN, { fetchPolicy: "network-only" })
  const { data: usersData } = useQuery<{
    getUsers: Array<{ id: string; fullName?: string | null; email: string; role: string }>
  }>(GET_USERS, { variables: { includeDeleted: false } })
  const { data: coursesData } = useQuery<{ getCourses: Array<{ id: string; title: string }> }>(GET_COURSES)

  const templates = tplData?.getCertificateTemplates ?? []
  const certificates = certData?.getCertificatesAdmin ?? []
  const students = useMemo(
    () => (usersData?.getUsers ?? []).filter((u) => u.role === "STUDENT"),
    [usersData?.getUsers]
  )
  const courses = coursesData?.getCourses ?? []

  const [createTemplate, { loading: creatingTpl }] = useMutation(CREATE_CERTIFICATE_TEMPLATE, {
    onCompleted: () => {
      toast.success("Template saved")
      setTemplateForm(emptyTemplate)
      setEditId(null)
      refetchTpl()
    },
    onError: (e) => toast.error(e.message),
  })
  const [updateTemplate, { loading: updatingTpl }] = useMutation(UPDATE_CERTIFICATE_TEMPLATE, {
    onCompleted: () => {
      toast.success("Template updated")
      setTemplateForm(emptyTemplate)
      setEditId(null)
      refetchTpl()
    },
    onError: (e) => toast.error(e.message),
  })
  const [deleteTemplate] = useMutation(DELETE_CERTIFICATE_TEMPLATE, {
    onCompleted: () => {
      toast.success("Template deleted")
      refetchTpl()
    },
    onError: (e) => toast.error(e.message),
  })
  const [issueCertificate, { loading: issuing }] = useMutation(ISSUE_CERTIFICATE, {
    onCompleted: () => {
      toast.success("Certificate issued")
      setIssueForm({ userId: "", courseId: "", templateId: "", message: "", status: "pending", percentageOverride: "" })
      refetchCert()
      setTab("issued")
    },
    onError: (e) => toast.error(e.message),
  })
  const [publishCertificate] = useMutation(PUBLISH_CERTIFICATE, {
    onCompleted: () => {
      toast.success("Certificate published")
      refetchCert()
    },
    onError: (e) => toast.error(e.message),
  })
  const [deleteCertificate] = useMutation(DELETE_CERTIFICATE, {
    onCompleted: () => {
      toast.success("Certificate removed")
      refetchCert()
    },
    onError: (e) => toast.error(e.message),
  })

  const startEdit = (t: TemplateRow) => {
    setEditId(t.id)
    setTemplateForm({
      name: t.name,
      titleLine: t.titleLine,
      subtitleLine: t.subtitleLine,
      bodyTemplate: t.bodyTemplate,
      footerLine: t.footerLine,
      directorName: t.directorName ?? "",
      directorTitle: t.directorTitle ?? "Director, TechOn Skills",
      mentorName: t.mentorName ?? "",
      mentorTitle: t.mentorTitle ?? "Lead Mentor",
      isDefault: t.isDefault,
    })
    setTab("templates")
  }

  const saveTemplate = () => {
    if (!templateForm.name.trim()) {
      toast.error("Template name is required")
      return
    }
    const input = { ...templateForm, name: templateForm.name.trim() }
    if (editId) updateTemplate({ variables: { id: editId, input } })
    else createTemplate({ variables: { input } })
  }

  const submitIssue = () => {
    if (!issueForm.userId || !issueForm.courseId || !issueForm.templateId) {
      toast.error("Select student, course, and template")
      return
    }
    issueCertificate({
      variables: {
        input: {
          userId: issueForm.userId,
          courseId: issueForm.courseId,
          templateId: issueForm.templateId,
          message: issueForm.message.trim() || undefined,
          status: issueForm.status,
          percentageOverride: issueForm.percentageOverride ? Number(issueForm.percentageOverride) : undefined,
        },
      },
    })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "templates", label: "Templates" },
    { id: "issue", label: "Issue certificate" },
    { id: "issued", label: "Issued certificates" },
  ]

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">Certificates</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Certificate management</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          Create branded templates, issue certificates with calculated grades, and publish them for students. QR codes
          link to public verification pages.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "brand-secondary" : "outline"}
            size="sm"
            shape="pill"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "templates" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-background/70 rounded-3xl backdrop-blur">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">{editId ? "Edit template" : "New template"}</h2>
              <Input
                placeholder="Template name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                placeholder="Title line"
                value={templateForm.titleLine}
                onChange={(e) => setTemplateForm((f) => ({ ...f, titleLine: e.target.value }))}
              />
              <Input
                placeholder="Subtitle line"
                value={templateForm.subtitleLine}
                onChange={(e) => setTemplateForm((f) => ({ ...f, subtitleLine: e.target.value }))}
              />
              <Textarea
                placeholder="Body template (use {{studentName}}, {{courseName}}, {{percentage}}, {{grade}})"
                rows={4}
                value={templateForm.bodyTemplate}
                onChange={(e) => setTemplateForm((f) => ({ ...f, bodyTemplate: e.target.value }))}
              />
              <Input
                placeholder="Footer line"
                value={templateForm.footerLine}
                onChange={(e) => setTemplateForm((f) => ({ ...f, footerLine: e.target.value }))}
              />
              <p className="text-muted-foreground pt-1 text-xs">
                Signatures on the certificate. The director&apos;s signature image comes from the uploaded CEO signature.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Director name"
                  aria-label="Director name"
                  maxLength={80}
                  value={templateForm.directorName}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, directorName: e.target.value }))}
                />
                <Input
                  placeholder="Director title"
                  aria-label="Director title"
                  maxLength={80}
                  value={templateForm.directorTitle}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, directorTitle: e.target.value }))}
                />
                <Input
                  placeholder="Mentor name"
                  aria-label="Mentor name"
                  maxLength={80}
                  value={templateForm.mentorName}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, mentorName: e.target.value }))}
                />
                <Input
                  placeholder="Mentor title"
                  aria-label="Mentor title"
                  maxLength={80}
                  value={templateForm.mentorTitle}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, mentorTitle: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={templateForm.isDefault}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, isDefault: e.target.checked }))}
                />
                Set as default template
              </label>
              <div className="flex gap-2">
                <Button onClick={saveTemplate} disabled={creatingTpl || updatingTpl}>
                  {editId ? "Update" : "Save template"}
                </Button>
                {editId && (
                  <Button variant="outline" onClick={() => { setEditId(null); setTemplateForm(emptyTemplate) }}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/70 rounded-3xl backdrop-blur">
            <CardContent className="p-0">
              {loadingTpl ? (
                <div className="flex items-center gap-2 p-8 text-muted-foreground">
                  <Loader2Icon className="size-5 animate-spin" /> Loading…
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
                  <AwardIcon className="size-10 opacity-40" />
                  <p>No templates yet. Create your first TechOn Skills branded template.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {templates.map((t) => (
                    <div key={t.id} className="flex items-start justify-between gap-4 p-4">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-muted-foreground text-xs">{t.titleLine}</div>
                        {t.isDefault && (
                          <span className="mt-1 inline-block rounded-full bg-(--brand-secondary)/20 px-2 py-0.5 text-xs">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="outline" size="sm" onClick={() => startEdit(t)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTemplate({ variables: { id: t.id } })}>
                          <Trash2Icon className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "issue" && (
        <Card className="bg-background/70 max-w-2xl rounded-3xl backdrop-blur">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">Issue certificate</h2>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Student</label>
              <select
                className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
                value={issueForm.userId}
                onChange={(e) => setIssueForm((f) => ({ ...f, userId: e.target.value }))}
              >
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName || s.email} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Course</label>
              <select
                className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
                value={issueForm.courseId}
                onChange={(e) => setIssueForm((f) => ({ ...f, courseId: e.target.value }))}
              >
                <option value="">Select course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Template</label>
              <select
                className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
                value={issueForm.templateId}
                onChange={(e) => setIssueForm((f) => ({ ...f, templateId: e.target.value }))}
              >
                <option value="">Select template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              placeholder="Custom message (optional — auto-filled from template if blank)"
              rows={3}
              value={issueForm.message}
              onChange={(e) => setIssueForm((f) => ({ ...f, message: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Override percentage (optional — auto-calculated from marks)"
              value={issueForm.percentageOverride}
              onChange={(e) => setIssueForm((f) => ({ ...f, percentageOverride: e.target.value }))}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Initial status</label>
              <select
                className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
                value={issueForm.status}
                onChange={(e) => setIssueForm((f) => ({ ...f, status: e.target.value as "pending" | "live" }))}
              >
                <option value="pending">Pending (review first)</option>
                <option value="live">Live (visible to student immediately)</option>
              </select>
            </div>
            <Button onClick={submitIssue} disabled={issuing}>
              <PlusIcon className="mr-2 size-4" />
              Issue certificate
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "issued" && (
        <>
          {loadingCert ? (
            <div className="flex items-center gap-2 py-16 text-muted-foreground">
              <Loader2Icon className="size-6 animate-spin" /> Loading…
            </div>
          ) : (
            <Card className="bg-background/70 overflow-hidden rounded-3xl backdrop-blur">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted-surface/40 border-b">
                      <tr>
                        <th className="p-4 font-semibold">Student</th>
                        <th className="p-4 font-semibold">Course</th>
                        <th className="p-4 font-semibold">Score</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-muted-foreground p-8 text-center">
                            No certificates issued yet.
                          </td>
                        </tr>
                      ) : (
                        certificates.map((c) => (
                          <tr key={c.id} className="hover:bg-muted-surface/20 border-b">
                            <td className="p-4">{c.studentName}</td>
                            <td className="p-4">{c.courseName}</td>
                            <td className="p-4">
                              {c.percentage}% ({c.grade})
                            </td>
                            <td className="p-4">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-1 text-xs font-medium",
                                  c.status === "live"
                                    ? "bg-green-500/20 text-green-600"
                                    : "bg-amber-500/20 text-amber-700"
                                )}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="text-muted-foreground p-4">
                              {formatDateLong(c.issuedAt ?? c.createdAt)}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                <Button variant="outline" size="sm" onClick={() => setPreviewCert(c)}>
                                  Preview
                                </Button>
                                {c.status === "pending" && (
                                  <Button variant="brand-secondary" size="sm" onClick={() => publishCertificate({ variables: { id: c.id } })}>
                                    Publish
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => deleteCertificate({ variables: { id: c.id } })}>
                                  <Trash2Icon className="size-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewCert(null)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CertificateView
              data={toCertificateViewData(previewCert)}
              showQr={previewCert.status === "live"}
            />
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => setPreviewCert(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
