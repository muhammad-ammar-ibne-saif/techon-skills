import type { IContactFormCourse } from "./courses"

/** Payload for POST /enrollment-application/submit */
export interface IEnrollmentApplicationSubmit {
  name: string
  email: string
  phone: string
  courses: IContactFormCourse[]
  message?: string
  paymentPlan: EnrollmentPaymentPlan
  requestedInstallments?: number
  feePaymentScreenshotDataUrl: string
  /** Coupon or referral code. */
  discountCode?: string
}

/** What a coupon or referral code takes off each course (per slug). */
export interface IEnrollmentCodeResult {
  code: string
  kind: "COUPON" | "REFERRAL"
  label: string
  discounts: { slug: string; amount: number }[]
}

/** A batch applicants can pick on the enrollment form. */
export interface IOpenBatch {
  id: string
  name: string
  startDate: string | null
  seats: number | null
  seatsLeft: number | null
  isFull: boolean
}

export type EnrollmentPaymentPlan = "FULL" | "TWO_INSTALLMENTS" | "MORE_INSTALLMENTS"

export type EnrollmentApplicationStatus = "pending" | "approved" | "rejected"

export interface IEnrollmentApplication {
  _id: string
  name: string
  email: string
  phone: string
  courses: IContactFormCourse[]
  message?: string
  paymentPlan?: EnrollmentPaymentPlan
  requestedInstallments?: number
  feePaymentScreenshotRelativePath: string
  status: EnrollmentApplicationStatus
  reviewedAt?: string
  createdUserId?: string
  rejectionReason?: string
  discountCode?: string
  discountLabel?: string
  courseDiscounts?: { slug: string; amount: number }[]
  createdAt: string
  updatedAt: string
}
