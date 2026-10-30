import * as Yup from "yup"
import { validatePhone, type PhoneValue } from "@/lib/ui/useable-components/phone-input"
import type { IContactFormCourse } from "@/utils/interfaces"

export const DEFAULT_PHONE: PhoneValue = { countryCode: "+92", number: "" }

/** General contact (no fee / no registration flags). */
export interface ContactFormValues {
  firstName: string
  lastName: string
  email: string
  phone: PhoneValue
  courses: IContactFormCourse[]
  message: string
}

export type EnrollmentPaymentPlan = "FULL" | "TWO_INSTALLMENTS" | "MORE_INSTALLMENTS"
export const MIN_REQUESTED_INSTALLMENTS = 3
export const MAX_REQUESTED_INSTALLMENTS = 4

/** Enrollment: contact fields + payment plan + fee screenshot for registration. */
export interface EnrollmentFormValues extends ContactFormValues {
  paymentPlan: EnrollmentPaymentPlan
  /** MORE_INSTALLMENTS only. */
  requestedInstallments: number
  feeScreenshot: File | null
}

/** What the applicant pays now for one course under the chosen plan (matches the API's schedule). */
export function firstPaymentFor(totalFee: number, plan: EnrollmentPaymentPlan, installments: number): number {
  if (plan === "FULL") return totalFee
  if (plan === "MORE_INSTALLMENTS" && installments > 0)
    return totalFee - Math.floor(totalFee / installments) * (installments - 1)
  return Math.ceil(totalFee / 2)
}

const phoneSchema = Yup.object({
  countryCode: Yup.string().required(),
  number: Yup.string()
    .required("Phone number is required.")
    .test("phone-valid", "Please enter a valid phone number (7–15 digits; with country code at most 15 digits total).", function (value) {
      const { countryCode } = this.parent as { countryCode: string }
      return validatePhone({ countryCode, number: value ?? "" })
    }),
}).required()

const coursesSchema = Yup.array()
  .of(
    Yup.object({
      slug: Yup.string().required(),
      title: Yup.string().required(),
    })
  )
  .min(1, "Please select at least one course.")
  .required("Please select at least one course.")

export const contactFormValidationSchema = Yup.object({
  firstName: Yup.string().trim().required("First name is required."),
  lastName: Yup.string().trim().required("Last name is required."),
  email: Yup.string()
    .trim()
    .required("Email is required.")
    .email("Please enter a valid email address."),
  phone: phoneSchema,
  courses: coursesSchema,
  message: Yup.string().trim().max(50000, "Message is too long.").optional(),
})

export const enrollmentFormValidationSchema = contactFormValidationSchema.shape({
  paymentPlan: Yup.string()
    .oneOf(["FULL", "TWO_INSTALLMENTS", "MORE_INSTALLMENTS"])
    .required("Choose how you'll pay."),
  requestedInstallments: Yup.number().integer().min(MIN_REQUESTED_INSTALLMENTS).max(MAX_REQUESTED_INSTALLMENTS).required(),
  feeScreenshot: Yup.mixed()
    .required("Please attach a screenshot of your fee payment.")
    .test("fee-image", "Please attach an image file (PNG or JPG).", (v) => v instanceof File && v.type.startsWith("image/"))
    .test("fee-size", "Image must be under 5 MB.", (v) => v instanceof File && v.size <= 5 * 1024 * 1024),
})

export function getContactFormInitialValues(
  initialCourse?: { slug: string; title: string } | null
): ContactFormValues {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: DEFAULT_PHONE,
    courses: initialCourse ? [{ slug: initialCourse.slug, title: initialCourse.title }] : [],
    message: "",
  }
}

export function getEnrollmentFormInitialValues(
  initialCourse?: { slug: string; title: string } | null
): EnrollmentFormValues {
  return {
    ...getContactFormInitialValues(initialCourse),
    paymentPlan: "TWO_INSTALLMENTS",
    requestedInstallments: MIN_REQUESTED_INSTALLMENTS,
    feeScreenshot: null,
  }
}

export function readFeeScreenshotAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("Could not read file."))
    reader.readAsDataURL(file)
  })
}
