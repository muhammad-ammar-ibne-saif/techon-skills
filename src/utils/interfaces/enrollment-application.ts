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
  createdAt: string
  updatedAt: string
}
