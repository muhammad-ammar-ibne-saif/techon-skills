"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useMemo, useRef, useState } from "react"
import { useQuery } from "@apollo/client/react"
import { CheckCircle2Icon, CopyIcon, CreditCardIcon, DownloadIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/ui/useable-components/card"
import { Separator } from "@/lib/ui/useable-components/separator"
import { useUser } from "@/lib/providers/user"
import { GET_PAYMENTS_BY_USER } from "@/lib/graphql"
import { apiService } from "@/lib/services"
import { cn, formatDate, formatDateISO, getApiDisplayMessage, isDueMonthReached } from "@/lib/helpers"
import type { IFeeEntry } from "@/utils/interfaces"
import type { FeeStatus } from "@/utils/types"
import { PAYMENT_BANK_DETAILS } from "@/utils/constants"

const ACCEPTED_IMAGE_TYPES = "image/*"

export const StudentFeesScreen = () => {
  const { userProfileInfo } = useUser()
  const userId = userProfileInfo?.id ?? ""
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [modalStep, setModalStep] = useState<"bank" | "upload">("bank")
  const [selectedFee, setSelectedFee] = useState<IFeeEntry | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [storedStatus, setStoredStatus] = useState<Record<string, FeeStatus>>(() => {
    if (typeof window === "undefined") return {}
    try {
      const statusRaw = window.localStorage.getItem("student:fees:status")
      return statusRaw ? JSON.parse(statusRaw) : {}
    } catch {
      return {}
    }
  })

  const { data: paymentsData, loading: paymentsLoading, refetch: refetchPayments } = useQuery<{
    getPaymentsByUser: Array<{
      id: string
      amount: number
      paymentDate: string
      paymentStatus: string
      paymentAttachment: string
      isPaid: boolean
      courseDetails?: {
        installmentNumber: number
        course?: { feePerMonth: number; currency: string } | null
      }
    }>
  }>(GET_PAYMENTS_BY_USER, { variables: { userId }, skip: !userId })

  const bankDetails = useMemo(() => {

    return {
      accountNumber: PAYMENT_BANK_DETAILS.accountNumber,
      bankName: PAYMENT_BANK_DETAILS.bankName,
      accountTitle: PAYMENT_BANK_DETAILS.accountTitle,
    }
  }, [])

  const rows = useMemo((): IFeeEntry[] => {
    const payments = paymentsData?.getPaymentsByUser ?? []
    if (payments.length === 0) return []
    return payments.map((p) => {
      const dueMonthReached = isDueMonthReached(p.paymentDate)
      const status: FeeStatus = p.isPaid
        ? "paid"
        : p.paymentStatus === "REJECTED"
          ? "rejected"
          : p.paymentAttachment && p.paymentAttachment !== "pending"
            ? "pending_approval"
            : dueMonthReached
              ? "due"
              : "upcoming"
      const inst = p.courseDetails?.installmentNumber ?? 0
      const month = inst > 0 ? `Installment ${inst}` : formatDate(p.paymentDate, { month: "long", year: "numeric", locale: "en-GB" })
      const course = p.courseDetails?.course
      // The installment amount is per student (discounts, custom plans), so never derive it from the course.
      const fee = p.amount
      const cur = (course?.currency ?? "PKR").trim() || "PKR"
      return {
        id: p.id,
        month,
        amount: `${cur} ${fee?.toLocaleString() ?? "0"}`,
        dueDate: formatDateISO(p.paymentDate),
        status,
        dueMonthReached,
      }
    })
  }, [paymentsData?.getPaymentsByUser])

  const clearUpload = () => {
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl)
    setUploadFile(null)
    setUploadPreviewUrl(null)
  }

  const handlePayNow = (fee: IFeeEntry) => {
    setSelectedFee(fee)
    setModalStep("bank")
    clearUpload()
    setOpen(true)
  }

  const handleUploadClick = () => {
    setModalStep("upload")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (e.g. PNG, JPG)")
      return
    }
    clearUpload()
    setUploadFile(file)
    setUploadPreviewUrl(URL.createObjectURL(file))
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (e.g. PNG, JPG)")
      return
    }
    clearUpload()
    setUploadFile(file)
    setUploadPreviewUrl(URL.createObjectURL(file))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleUploadConfirm = async () => {
    if (!selectedFee) return
    if (!uploadFile) {
      toast.error("Please select a payment screenshot first.")
      return
    }
    setUploading(true)
    try {
      const res = await apiService.uploadImage(uploadFile, "users", userId)
      if (!res.success || !res.data?.url) {
        toast.error(getApiDisplayMessage(res, "Failed to upload screenshot."))
        return
      }
      const proofRes = await apiService.submitFeeProof({
        paymentId: selectedFee.id,
        attachmentUrl: res.data.url,
      })
      if (!proofRes.success) {
        toast.error(getApiDisplayMessage(proofRes, "Failed to submit payment proof."))
        return
      }
      void refetchPayments()
      const next = { ...storedStatus, [selectedFee.id]: "pending_approval" as const }
      setStoredStatus(next)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("student:fees:status", JSON.stringify(next))
      }
      toast.success("Screenshot uploaded. Your payment is pending approval.")
      clearUpload()
      setOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit payment proof."
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text)
  }

  const accessLockedDueToDues = rows.some((r) => r.status === "due" && r.dueMonthReached)

  const downloadInvoice = (fee: IFeeEntry) => {
    const name = userProfileInfo?.fullName ?? userProfileInfo?.email ?? "Student"
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Fee invoice</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto} h1{font-size:1.25rem} table{width:100%;border-collapse:collapse;margin-top:16px} td,th{border:1px solid #ccc;padding:8px;text-align:left}</style></head><body>
      <h1>Fee invoice</h1>
      <p><strong>Student:</strong> ${name}</p>
      <p><strong>Reference:</strong> ${fee.id}</p>
      <table><tr><th>Period</th><th>Amount</th><th>Due</th><th>Status</th></tr>
      <tr><td>${fee.month}</td><td>${fee.amount}</td><td>${fee.dueDate}</td><td>${fee.status}</td></tr></table>
      <p style="margin-top:24px;font-size:12px;color:#666">Generated ${new Date().toLocaleString()}</p>
      </body></html>`
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div className="w-full py-10">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">Fees</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Fee payments & status
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
          Your course fee installments. Pay online and upload proof to update your status.
        </p>
      </div>

      {accessLockedDueToDues && (
        <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <strong>Access denied.</strong> Please contact administration to clear dues. Your student portal is limited until overdue payments are resolved.
        </div>
      )}

      {paymentsLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2Icon className="size-6 animate-spin" />
          <span>Loading fees...</span>
        </div>
      ) : !userId ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>Please sign in to view your fees.</p>
        </div>
      ) : (
        <Card className="bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60 rounded-3xl overflow-auto">
          <CardContent className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-border border-b">
                <tr>
                  <th className="p-4 font-semibold">Month</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Due Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isDue = r.status === "due" && r.dueMonthReached
                  const isPendingApproval = r.status === "pending_approval"
                  const isOrangeRow = isPendingApproval && r.dueMonthReached
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-border border-b transition-colors hover:bg-background/40",
                        isDue && "bg-destructive/5",
                        isOrangeRow && "bg-amber-500/5"
                      )}
                    >
                      <td className={cn("p-4", isDue && "font-medium text-destructive", isOrangeRow && "font-medium text-amber-600 dark:text-amber-500")}>{r.month}</td>
                      <td className={cn("p-4 font-semibold", isDue && "text-destructive", isOrangeRow && "text-amber-600 dark:text-amber-500")}>{r.amount}</td>
                      <td className={cn("p-4", isDue && "font-medium text-destructive", isOrangeRow && "font-medium text-amber-600 dark:text-amber-500", !isDue && !isOrangeRow && "text-muted-foreground")}>{r.dueDate}</td>
                      <td className="p-4">
                        {r.status === "paid" ? (
                          <span className="bg-(--brand-primary) text-(--text-on-dark) inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold">
                            <CheckCircle2Icon className="size-3.5" />
                            Paid
                          </span>
                        ) : r.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                            Rejected
                          </span>
                        ) : r.status === "pending_approval" ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold",
                            r.dueMonthReached
                              ? "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-500"
                              : "border-border bg-muted-surface/50 text-muted-foreground"
                          )}>
                            Pending approval
                          </span>
                        ) : r.status === "upcoming" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted-surface/50 px-2 py-1 text-xs font-semibold text-muted-foreground">
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/15 px-2 py-1 text-xs font-semibold text-destructive">
                            Due
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {(r.status === "rejected" ||
                            r.status === "upcoming" ||
                            (r.status === "due" && r.dueMonthReached)) && (
                            <Button
                              type="button"
                              variant="brand-secondary"
                              shape="pill"
                              className="h-9"
                              onClick={() => handlePayNow(r)}
                            >
                              <CreditCardIcon className="size-4" />
                              Pay now
                            </Button>
                          )}
                          {r.status === "paid" && (
                            <Button
                              type="button"
                              variant="outline"
                              shape="pill"
                              className="h-9"
                              onClick={() => downloadInvoice(r)}
                            >
                              <DownloadIcon className="size-4" />
                              Invoice
                            </Button>
                          )}
                          {r.status !== "paid" &&
                            r.status !== "rejected" &&
                            r.status !== "upcoming" &&
                            !(r.status === "due" && r.dueMonthReached) && (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Pay now modal */}
      <DialogPrimitive.Root
        open={open}
        onOpenChange={(open) => {
          setOpen(open)
          if (!open) clearUpload()
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <DialogPrimitive.Content
            className="bg-card text-primary data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-right fixed left-1/2 top-1/2 z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border shadow-xl outline-none transition-all duration-300"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-full p-1 transition-colors hover:bg-background/50"
            >
              <XIcon className="size-4" />
            </button>

            {modalStep === "bank" && (
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <div className="text-primary text-xl font-semibold">Payment details</div>
                  <div className="text-muted-foreground text-sm">
                    Send your fee to this {bankDetails.bankName} account from NayaPay, any bank app or wallet.
                  </div>
                </div>

                <Card className="bg-background/60 backdrop-blur supports-backdrop-filter:bg-background/50 rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-base">Payment account</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-2xl border bg-background/40 p-4">
                      <div className="text-muted-foreground text-xs">Account Number</div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="font-mono text-lg font-semibold">{bankDetails.accountNumber || "—"}</div>
                        {bankDetails.accountNumber && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            shape="pill"
                            onClick={() => copyToClipboard(bankDetails.accountNumber)}
                          >
                            <CopyIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-background/40 p-4">
                      <div className="text-muted-foreground text-xs">Bank / wallet</div>
                      <div className="mt-1 font-semibold">{bankDetails.bankName || "—"}</div>
                    </div>

                    <div className="rounded-2xl border bg-background/40 p-4">
                      <div className="text-muted-foreground text-xs">Account Title</div>
                      <div className="mt-1 font-semibold">{bankDetails.accountTitle || "—"}</div>
                    </div>
                  </CardContent>
                </Card>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="text-muted-foreground text-sm leading-7">
                    After payment, upload a screenshot of your transaction to update your fee status.
                  </div>
                  <Button
                    type="button"
                    variant="brand-secondary"
                    shape="pill"
                    className="h-11 w-full"
                    onClick={handleUploadClick}
                  >
                    <UploadIcon className="size-4" />
                    Upload payment screenshot
                  </Button>
                </div>
              </div>
            )}

            {modalStep === "upload" && (
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <div className="text-primary text-xl font-semibold">Upload payment proof</div>
                  <div className="text-muted-foreground text-sm">
                    Attach your bank or payment screenshot below. Required to submit.
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  className="sr-only"
                  aria-hidden
                  onChange={handleFileChange}
                />
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "rounded-2xl border-2 border-dashed bg-background/40 p-8 text-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    uploadFile ? "border-(--brand-primary) bg-(--brand-primary)/5" : "hover:border-ring hover:bg-background/50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                >
                  {uploadPreviewUrl ? (
                    <div className="space-y-2 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                      <img
                        src={uploadPreviewUrl}
                        alt="Payment screenshot preview"
                        className="mx-auto max-h-40 rounded-lg object-contain border bg-background/80"
                      />
                      <p className="text-muted-foreground text-sm font-medium truncate px-2" title={uploadFile?.name}>
                        {uploadFile?.name}
                      </p>
                      <p className="text-muted-foreground text-xs">Click or drop another image to replace</p>
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="text-muted-foreground mx-auto size-10" />
                      <div className="text-muted-foreground mt-3 text-sm">
                        Click or drag your screenshot here
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">PNG, JPG or other image</div>
                    </>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    shape="pill"
                    className="h-11 flex-1"
                    onClick={() => { setModalStep("bank"); clearUpload(); }}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="brand-secondary"
                    shape="pill"
                    className="h-11 flex-1"
                    disabled={!uploadFile || uploading}
                    onClick={handleUploadConfirm}
                  >
                    {uploading ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle2Icon className="size-4" />
                    )}
                    {uploading ? "Uploading…" : "Confirm upload"}
                  </Button>
                </div>
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
