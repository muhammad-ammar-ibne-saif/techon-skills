"use client"

import { useMemo } from "react"

import { useCourses } from "@/lib/providers/courses"
import type { IContactFormCourse } from "@/utils/interfaces"
import { cn } from "@/lib/helpers"
import { firstPaymentFor, type EnrollmentPaymentPlan } from "@/lib/helpers/contact-form"

type ContactCourseFeesSummaryProps = {
  selectedCourses: IContactFormCourse[]
  paymentPlan: EnrollmentPaymentPlan
  /** MORE_INSTALLMENTS only. */
  requestedInstallments: number
  className?: string
}

/**
 * Shows what is paid now for each selected course under the chosen payment plan, and the total.
 * Placed below course multi-select; student uploads one screenshot for the combined payment.
 */
export function ContactCourseFeesSummary({
  selectedCourses,
  paymentPlan,
  requestedInstallments,
  className,
}: ContactCourseFeesSummaryProps) {
  const { getCourseBySlug } = useCourses()

  const { rows, total, currency, canSum, mixedCurrency } = useMemo(() => {
    const resolved = selectedCourses.map((c) => {
      const full = getCourseBySlug(c.slug)
      const fee =
        typeof full?.totalFee === "number"
          ? firstPaymentFor(full.totalFee, paymentPlan, requestedInstallments)
          : undefined
      const cur = (full?.currency ?? "PKR").trim() || "PKR"
      return { slug: c.slug, title: c.title, fee, currency: cur }
    })
    const currencySet = new Set(resolved.map((r) => r.currency))
    const mixed = currencySet.size > 1
    const sum = !mixed
      ? resolved.reduce((s, r) => s + (typeof r.fee === "number" && !Number.isNaN(r.fee) ? r.fee : 0), 0)
      : null
    const primaryCurrency = resolved[0]?.currency ?? "PKR"
    return {
      rows: resolved,
      total: sum,
      currency: primaryCurrency,
      canSum: !mixed && sum !== null,
      mixedCurrency: mixed,
    }
  }, [selectedCourses, getCourseBySlug, paymentPlan, requestedInstallments])

  if (selectedCourses.length === 0) return null

  return (
    <div
      className={cn(
        "border-border bg-muted-surface/40 rounded-2xl border px-4 py-3 text-sm",
        className
      )}
    >
      <div className="text-foreground mb-2 font-semibold">
        {paymentPlan === "FULL" ? "Full fee (per course)" : "First installment (per course)"}
      </div>
      <ul className="text-muted-foreground space-y-1.5">
        {rows.map((r) => (
          <li key={r.slug} className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1 leading-snug">{r.title}</span>
            <span className="text-foreground shrink-0 font-medium tabular-nums">
              {typeof r.fee === "number"
                ? `${r.currency} ${r.fee.toLocaleString()}`
                : "—"}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-border mt-3 flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-foreground font-semibold">Pay now</span>
        <span className="text-foreground text-base font-semibold tabular-nums">
          {canSum && total !== null ? `${currency} ${total.toLocaleString()}` : "—"}
        </span>
      </div>
      {mixedCurrency && (
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          These courses use different currencies; pay the total your bank shows and upload that receipt.
        </p>
      )}
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        {paymentPlan === "FULL"
          ? "You pay the whole fee now."
          : paymentPlan === "MORE_INSTALLMENTS"
            ? `You're asking for ${requestedInstallments} monthly installments. We'll confirm the schedule when we approve your application.`
            : "The second installment is due one month later."}{" "}
        Pay this total, then upload one screenshot of the transfer below.
      </p>
    </div>
  )
}
