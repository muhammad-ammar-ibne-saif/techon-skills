"use client"

import { useMemo } from "react"

import { useCourses } from "@/lib/providers/courses"
import type { IContactFormCourse } from "@/utils/interfaces"
import { cn } from "@/lib/helpers"
import { courseFeeBreakdown, type EnrollmentPaymentPlan } from "@/lib/helpers/contact-form"

type PlanTotals = { payNow: number; later: number; discount: number; courseFee: number; codeDiscount: number }

/** Amount a coupon or referral code takes off each course, by slug. */
export type CodeDiscounts = { slug: string; amount: number }[]

/**
 * Fees of the selected courses under both payment plans. Totals are null when a course has no fee
 * yet or the courses use different currencies.
 */
export function useEnrollmentFees(selectedCourses: IContactFormCourse[], codeDiscounts: CodeDiscounts = []) {
  const { getCourseBySlug } = useCourses()
  return useMemo(() => {
    const rows = selectedCourses.map((c) => {
      const full = getCourseBySlug(c.slug)
      const fee = typeof full?.totalFee === "number" && full.totalFee > 0 ? full.totalFee : undefined
      const months = full?.courseDurationInMonths
      // A code comes off the course fee first; the plan (and its full-payment month off) works on the rest.
      const off = fee === undefined ? 0 : Math.min(fee, codeDiscounts.find((d) => d.slug === c.slug)?.amount ?? 0)
      const net = fee === undefined ? undefined : fee - off
      return {
        off,
        slug: c.slug,
        title: c.title,
        currency: (full?.currency ?? "PKR").trim() || "PKR",
        fee,
        FULL: net === undefined ? undefined : courseFeeBreakdown(net, months, "FULL"),
        TWO_INSTALLMENTS: net === undefined ? undefined : courseFeeBreakdown(net, months, "TWO_INSTALLMENTS"),
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
              codeDiscount: t.codeDiscount + r.off,
            }),
            { payNow: 0, later: 0, discount: 0, courseFee: 0, codeDiscount: 0 }
          )
        : null
    return {
      rows,
      currency: rows[0]?.currency ?? "PKR",
      mixedCurrency,
      totals: { FULL: sum("FULL"), TWO_INSTALLMENTS: sum("TWO_INSTALLMENTS") },
    }
  }, [selectedCourses, getCourseBySlug, codeDiscounts])
}

export const formatFee = (currency: string, amount: number) => `${currency} ${amount.toLocaleString()}`

type ContactCourseFeesSummaryProps = {
  selectedCourses: IContactFormCourse[]
  paymentPlan: EnrollmentPaymentPlan
  className?: string
  /** Applied coupon or referral code. */
  code?: { label: string; discounts: CodeDiscounts } | null
}

/**
 * Shows each selected course's fee under the chosen payment plan and what to pay now.
 * Placed below course multi-select; student uploads one screenshot for the combined payment.
 */
export function ContactCourseFeesSummary({ selectedCourses, paymentPlan, className, code }: ContactCourseFeesSummaryProps) {
  const { rows, currency, mixedCurrency, totals } = useEnrollmentFees(selectedCourses, code?.discounts)
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
                ) : (isFull && b.discount > 0) || r.off > 0 ? (
                  <>
                    <span className="mr-1.5 line-through">{formatFee(r.currency, r.fee)}</span>
                    <span className="text-foreground font-medium">{formatFee(r.currency, isFull ? b.payNow : r.fee - r.off)}</span>
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
          {((isFull && total.discount > 0) || total.codeDiscount > 0) && (
            <div className="text-muted-foreground flex justify-between gap-3">
              <dt>Course fee</dt>
              <dd className="tabular-nums">{formatFee(currency, total.courseFee)}</dd>
            </div>
          )}
          {total.codeDiscount > 0 && (
            <div className="flex justify-between gap-3 font-medium text-emerald-600 dark:text-emerald-400">
              <dt>{code?.label ?? "Discount code"}</dt>
              <dd className="tabular-nums">−{formatFee(currency, total.codeDiscount)}</dd>
            </div>
          )}
          {isFull && total.discount > 0 && (
            <div className="flex justify-between gap-3 font-medium text-emerald-600 dark:text-emerald-400">
              <dt>Full-payment discount</dt>
              <dd className="tabular-nums">−{formatFee(currency, total.discount)}</dd>
            </div>
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
