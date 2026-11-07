"use client"

import { useState, useEffect, useCallback } from "react"
import {
  SearchIcon,
  MailIcon,
  CalendarIcon,
  UserIcon,
  Loader2Icon,
  InboxIcon,
  SendIcon,
  PhoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  NotebookPenIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { getApiDisplayMessage, formatDateTime } from "@/lib/helpers"
import { apiService } from "@/lib/services"
import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import { RichTextEditor } from "@/lib/ui/useable-components/rich-text-editor"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/lib/ui/useable-components/sheet"
import type { IContactFormSubmission, LeadStatus } from "@/utils/interfaces/contact-form"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { cn } from "@/lib/helpers"
import { SheetContentSide } from "@/utils/enums"

const PAGE_SIZE = 10

const LEAD_STATUSES: { value: LeadStatus; label: string; className: string }[] = [
  { value: "NEW", label: "New", className: "bg-sky-500/15 text-sky-700 dark:text-sky-400" },
  { value: "CALLED", label: "Called", className: "bg-violet-500/15 text-violet-700 dark:text-violet-400" },
  { value: "INTERESTED", label: "Interested", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  { value: "ENROLLED", label: "Enrolled", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  { value: "LOST", label: "Lost", className: "bg-muted text-muted-foreground" },
]
const statusMeta = (s?: LeadStatus) => LEAD_STATUSES.find((x) => x.value === (s ?? "NEW")) ?? LEAD_STATUSES[0]!

/** Today in Pakistan time, YYYY-MM-DD. */
const todayInPakistan = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })
const dayOf = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }) : "")

export const AdminContactSubmissionsScreen = () => {
  const [submissions, setSubmissions] = useState<IContactFormSubmission[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [sendEmailOpen, setSendEmailOpen] = useState<IContactFormSubmission | null>(null)
  const [leadOpen, setLeadOpen] = useState<IContactFormSubmission | null>(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [counts, setCounts] = useState<Record<string, number>>({})

  const fetchCounts = useCallback(async () => {
    const res = await apiService.getLeadCounts()
    if (res.success && res.data) setCounts(res.data)
  }, [])

  const replaceSubmission = (doc: IContactFormSubmission) => {
    setSubmissions((list) => list.map((s) => (s._id === doc._id ? doc : s)))
    setLeadOpen((cur) => (cur && cur._id === doc._id ? doc : cur))
    void fetchCounts()
  }

  const changeStatus = async (sub: IContactFormSubmission, status: LeadStatus) => {
    const res = await apiService.updateLead({ submissionId: sub._id, status })
    if (res.success && res.data) replaceSubmission(res.data)
    else toast.error(getApiDisplayMessage(res, "Couldn't update the status."))
  }

  const fetchSubmissions = useCallback(async (pageNum: number, status: string) => {
    setLoading(true)
    const response = await apiService.getContactFormSubmissions(pageNum, PAGE_SIZE, status)
    setLoading(false)
    if (response.success && response.data) {
      setSubmissions(response.data)
      setTotal(response.total)
    } else {
      setSubmissions([])
      if (response.total !== undefined) setTotal(response.total)
      if (!response.success) {
        toast.error(getApiDisplayMessage(response, "Failed to load contact submissions."))
      }
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the API
    void fetchSubmissions(page, statusFilter)
  }, [fetchSubmissions, page, statusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the API
    void fetchCounts()
  }, [fetchCounts])

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.message?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">Admin</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Contact form submissions
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          View submissions from the public contact form. Send emails and assign courses to students from here.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-[linear-gradient(135deg,rgba(70,208,255,0.20),rgba(255,138,61,0.10),transparent_70%)] p-px">
          <Card className="bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60 rounded-3xl">
            <CardContent className="p-6">
              <div className="text-muted-foreground text-xs mb-1">
                {total != null ? "Total submissions" : "Submissions on this page"}
              </div>
              <div className="text-3xl font-semibold tracking-tight text-(--brand-primary)">
                {loading ? "—" : total != null ? total : submissions.length}
              </div>
              <div className="text-muted-foreground text-xs mt-1">Page {page}{total != null ? ` of ${Math.ceil(total / PAGE_SIZE) || 1}` : ""}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: "", label: "All" },
          { value: "FOLLOW_UP", label: "Call back due" },
          ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label })),
        ].map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => {
              setStatusFilter(f.value)
              setPage(1)
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              statusFilter === f.value ? "border-(--brand-primary) bg-(--brand-primary)/10 font-medium" : "hover:bg-muted"
            )}
          >
            {f.label}
            {f.value && counts[f.value] != null ? <span className="text-muted-foreground ml-1.5">{counts[f.value]}</span> : null}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, phone or message..."
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
                {page === 1 && <span>Loading submissions...</span>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-border border-b bg-background/40">
                    <tr>
                      <th className="p-4 font-semibold">Contact</th>
                      <th className="p-4 font-semibold">Message</th>
                      <th className="p-4 font-semibold">Courses</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Submitted</th>
                      <th className="p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((sub, idx) => (
                      <tr
                        key={sub._id}
                        className="border-border border-b transition-colors hover:bg-background/60 animate-in fade-in slide-in-from-bottom-2 duration-500"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-(--brand-primary) text-(--text-on-dark) size-10 rounded-xl flex items-center justify-center shrink-0">
                              <UserIcon className="size-5" />
                            </div>
                            <div>
                              <div className="font-semibold">{sub.name}</div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MailIcon className="size-3" />
                                <span className="truncate max-w-[180px]">{sub.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <PhoneIcon className="size-3" />
                                {sub.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 max-w-[220px]">
                          <span className="text-muted-foreground text-xs line-clamp-2">
                            {sub.message || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {sub.courses?.length
                              ? sub.courses.slice(0, 3).map((c) => (
                                <span
                                  key={c.slug}
                                  className="rounded-full bg-(--brand-primary)/15 px-2 py-0.5 text-xs font-medium text-(--brand-primary)"
                                >
                                  {c.title}
                                </span>
                              ))
                              : "—"}
                            {sub.courses?.length > 3 && (
                              <span className="text-muted-foreground text-xs">+{sub.courses.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            aria-label={`Status of ${sub.name}`}
                            value={sub.leadStatus ?? "NEW"}
                            onChange={(e) => void changeStatus(sub, e.target.value as LeadStatus)}
                            className={cn("rounded-full border-0 px-2.5 py-1 text-xs font-medium", statusMeta(sub.leadStatus).className)}
                          >
                            {LEAD_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          {sub.followUpAt && sub.leadStatus !== "ENROLLED" && sub.leadStatus !== "LOST" && (
                            <div
                              className={cn(
                                "mt-1 text-xs",
                                dayOf(sub.followUpAt) <= todayInPakistan() ? "font-medium text-rose-600" : "text-muted-foreground"
                              )}
                            >
                              Call back {dayOf(sub.followUpAt)}
                            </div>
                          )}
                          {!!sub.notes?.length && <div className="text-muted-foreground mt-1 text-xs">{sub.notes.length} notes</div>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="size-3" />
                            {formatDateTime(sub.createdAt)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" size="sm" shape="pill" onClick={() => setLeadOpen(sub)}>
                              <NotebookPenIcon className="size-4" />
                              <span className="ml-2">Notes</span>
                            </Button>
                            <Button
                              type="button"
                              variant="brand-secondary"
                              size="sm"
                              shape="pill"
                              onClick={() => setSendEmailOpen(sub)}
                            >
                              <SendIcon className="size-4" />
                              <span className="ml-2">Send email</span>
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
          {!loading && (submissions.length > 0 || page > 1) && (
            <div className="border-border flex items-center justify-between border-t px-4 py-3">
              <div className="text-muted-foreground text-sm">
                {total != null
                  ? `Page ${page} of ${Math.ceil(total / PAGE_SIZE) || 1}`
                  : `Page ${page}`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeftIcon className="size-4" />
                  <span className="ml-1">Previous</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={total != null ? page * PAGE_SIZE >= total : submissions.length < PAGE_SIZE}
                >
                  <span className="mr-1">Next</span>
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {!loading && filteredSubmissions.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed bg-background/40 py-16 text-center">
          <InboxIcon className="size-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">
            {submissions.length === 0
              ? "No contact form submissions yet."
              : "No submissions match your search."}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {submissions.length === 0
              ? "Submissions will appear here when visitors use the contact form."
              : "Try a different search term."}
          </p>
        </div>
      )}

      <SendEmailSheet
        key={sendEmailOpen?._id ?? "none"}
        submission={sendEmailOpen}
        open={!!sendEmailOpen}
        onOpenChange={(open) => !open && setSendEmailOpen(null)}
        onSuccess={() => setSendEmailOpen(null)}
      />
      <LeadSheet lead={leadOpen} onOpenChange={(open) => !open && setLeadOpen(null)} onSaved={replaceSubmission} />
    </div>
  )
}

function LeadSheet({
  lead,
  onOpenChange,
  onSaved,
}: {
  lead: IContactFormSubmission | null
  onOpenChange: (open: boolean) => void
  onSaved: (doc: IContactFormSubmission) => void
}) {
  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent side={SheetContentSide.RIGHT} className="sm:max-w-md">
        {lead && <LeadSheetBody key={lead._id} lead={lead} onSaved={onSaved} />}
      </SheetContent>
    </Sheet>
  )
}

function LeadSheetBody({ lead, onSaved }: { lead: IContactFormSubmission; onSaved: (doc: IContactFormSubmission) => void }) {
  const [note, setNote] = useState("")
  const [followUp, setFollowUp] = useState(dayOf(lead.followUpAt))
  const [saving, setSaving] = useState(false)
  const notes = [...(lead.notes ?? [])].reverse()

  const save = async () => {
    setSaving(true)
    const res = await apiService.updateLead({
      submissionId: lead._id,
      note: note.trim() || undefined,
      followUpAt: followUp !== dayOf(lead.followUpAt) ? followUp : undefined,
    })
    setSaving(false)
    if (res.success && res.data) {
      onSaved(res.data)
      setNote("")
      toast.success("Saved")
    } else toast.error(getApiDisplayMessage(res, "Couldn't save."))
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{lead.name}</SheetTitle>
        <SheetDescription>
          {lead.phone} · {lead.email}
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-4 overflow-y-auto px-4">
        {lead.message && <p className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-line">{lead.message}</p>}
        <div>
          <label className="text-muted-foreground mb-1.5 block text-sm font-medium">Call back on</label>
          <div className="flex gap-2">
            <Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="rounded-xl" />
            {followUp && (
              <Button type="button" variant="outline" onClick={() => setFollowUp("")}>
                Clear
              </Button>
            )}
          </div>
        </div>
        <div>
          <label className="text-muted-foreground mb-1.5 block text-sm font-medium">Add a note</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder="Called, wants the evening batch…" />
        </div>
        <div className="space-y-2">
          {notes.length ? (
            notes.map((n, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <p className="whitespace-pre-line">{n.text}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {n.byName} · {formatDateTime(n.at)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No notes yet.</p>
          )}
        </div>
      </div>
      <SheetFooter className="flex-row gap-2 sm:flex-row">
        <Button
          type="button"
          variant="brand-secondary"
          onClick={() => void save()}
          disabled={saving || (!note.trim() && followUp === dayOf(lead.followUpAt))}
        >
          {saving && <Loader2Icon className="size-4 animate-spin" />}
          Save
        </Button>
      </SheetFooter>
    </>
  )
}

function SendEmailSheet({
  submission,
  open,
  onOpenChange,
  onSuccess,
}: {
  submission: IContactFormSubmission | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!submission) return
    setSending(true)
    const toastId = toast.loading("Sending email...")
    const response = await apiService.sendEmailToContact(submission._id, subject, body)
    toast.dismiss(toastId)
    setSending(false)
    if (response.success) {
      toast.success(getApiDisplayMessage(response, "Email sent successfully."))
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error(getApiDisplayMessage(response, "Failed to send email. Please try again."))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={SheetContentSide.RIGHT} className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Send email</SheetTitle>
          <SheetDescription>
            {submission ? (
              <>
                To: <span className="font-medium text-foreground">{submission.email}</span>
                {submission.name && (
                  <span className="text-muted-foreground"> ({submission.name})</span>
                )}
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div>
            <label className="text-muted-foreground mb-1.5 block text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-1.5 block text-sm font-medium">Message</label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Write your message..."
              minHeight="160px"
            />
          </div>
        </div>
        <SheetFooter className="flex-row gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand-secondary"
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
          >
            {sending ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
            <span className="ml-2">{sending ? "Sending..." : "Send email"}</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

