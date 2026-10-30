"use client"

import { useMemo } from "react"

import { useCourses } from "@/lib/providers/courses"
import type { IContactFormCourse } from "@/utils/interfaces"
import { cn } from "@/lib/helpers"
import { courseFeeBreakdown, type EnrollmentPaymentPlan } from "@/lib/helpers/contact-form"

type PlanTotals = { payNow: number; later: number; discount: number; courseFee: number }

/**
 * Fees of the selected courses under both payment plans. Totals are null when a course has no fee
 * yet or the courses use different currencies.
 */
export function useEnrollmentFees(selectedCourses: IContactFormCourse[]) {
  const { getCourseBySlug } = useCourses()
  return useMemo(() => {
    const rows = selectedCourses.map((c) => {
      const full = getCourseBySlug(c.slug)
      const fee = typeof full?.totalFee === "number" && full.totalFee > 0 ? full.totalFee : undefined
      const months = full?.courseDurationInMonths
      return {
        slug: c.slug,
        title: c.title,
        currency: (full?.currency ?? "PKR").trim() || "PKR",
        fee,
        FULL: fee === undefined ? undefined : courseFeeBreakdown(fee, months, "FULL"),
        TWO_INSTALLMENTS: fee === undefined ? undefined : courseFeeBreakdown(fee, months, "TWO_INSTALLMENTS"),
      }
    })
    const mixedCurrency = new Set(rows.map((r) => r.currency)).size > 1
    const complete = rows.length > 0 && !mixedCurrency && rows.every((r) => r.fee !== undefined)
    const sum = (plan: EnrollmentPaymentPlan): PlanTotals | null =>
      complete
        ? rows.reduce(
            (t, r) => ({
              payNow: t.payNow + r[plan]!.payNow,
              later: t.later + r[plan]!.later,
              discount: t.discount + r[plan]!.discount,
              courseFee: t.courseFee + r.fee!,
            }),
            { payNow: 0, later: 0, discount: 0, courseFee: 0 }
          )
        : null
    return {
      rows,
      currency: rows[0]?.currency ?? "PKR",
      mixedCurrency,
      totals: { FULL: sum("FULL"), TWO_INSTALLMENTS: sum("TWO_INSTALLMENTS") },
    }
  }, [selectedCourses, getCourseBySlug])
}

export const formatFee = (currency: string, amount: number) => `${currency} ${amount.toLocaleString()}`

type ContactCourseFeesSummaryProps = {
  selectedCourses: IContactFormCourse[]
  paymentPlan: EnrollmentPaymentPlan
  className?: string
}

/**
 * Shows each selected course's fee under the chosen payment plan and what to pay now.
 * Placed below course multi-select; student uploads one screenshot for the combined payment.
 */
export function ContactCourseFeesSummary({ selectedCourses, paymentPlan, className }: ContactCourseFeesSummaryProps) {
  const { rows, currency, mixedCurrency, totals } = useEnrollmentFees(selectedCourses)
  if (selectedCourses.length === 0) return null
  const total = totals[paymentPlan]
  const isFull = paymentPlan === "FULL"

  return (
    <div className={cn("border-border bg-muted-surface/40 rounded-2xl border px-4 py-3 text-sm", className)}>
      <div className="text-foreground mb-2 font-semibold">Course fee</div>
      <ul className="text-muted-foreground space-y-1.5">
        {rows.map((r) => {
          const b = r[paymentPlan]
          return (
            <li key={r.slug} className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1 leading-snug">{r.title}</span>
              <span className="shrink-0 text-right tabular-nums">
                {r.fee === undefined || !b ? (
                  "—"
                ) : isFull && b.discount > 0 ? (
                  <>
                    <span className="mr-1.5 line-through">{formatFee(r.currency, r.fee)}</span>
                    <span className="text-foreground font-medium">{formatFee(r.currency, b.payNow)}</span>
                  </>
                ) : (
                  <span className="text-foreground font-medium">{formatFee(r.currency, r.fee)}</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {total && (
        <dl className="border-border mt-3 space-y-1 border-t pt-3">
          {isFull && total.discount > 0 && (
            <>
              <div className="text-muted-foreground flex justify-between gap-3">
                <dt>Course fee</dt>
                <dd className="tabular-nums">{formatFee(currency, total.courseFee)}</dd>
              </div>
              <div className="flex justify-between gap-3 font-medium text-emerald-600 dark:text-emerald-400">
                <dt>Full-payment discount</dt>
                <dd className="tabular-nums">−{formatFee(currency, total.discount)}</dd>
              </div>
            </>
          )}
          {!isFull && (
            <div className="text-muted-foreground flex justify-between gap-3">
              <dt>2nd installment, one month later</dt>
              <dd className="tabular-nums">{formatFee(currency, total.later)}</dd>
            </div>
          )}
          <div className="text-foreground flex items-center justify-between gap-3 pt-1 font-semibold">
            <dt>Pay now</dt>
            <dd className="text-base tabular-nums">{formatFee(currency, total.payNow)}</dd>
          </div>
        </dl>
      )}

      {mixedCurrency && (
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          These courses use different currencies; pay the total your bank shows and upload that receipt.
        </p>
      )}
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        {isFull
          ? "Paying the whole fee at once saves you one month's fee."
          : "You pay the full course fee in two equal parts."}{" "}
        Pay {total ? "this amount" : "the amount above"}, then upload one screenshot of the transfer below.
      </p>
    </div>
  )
}
