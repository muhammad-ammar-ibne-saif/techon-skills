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

export type EnrollmentPaymentPlan = "FULL" | "TWO_INSTALLMENTS"

/** Enrollment: contact fields + payment plan + fee screenshot for registration. */
export interface EnrollmentFormValues extends ContactFormValues {
  paymentPlan: EnrollmentPaymentPlan
  feeScreenshot: File | null
}

/**
 * Fee when the whole course is paid in one go: one month's fee off (e.g. 30,000 over 6 months → 25,000).
 * Courses shorter than two months get no discount. Must match the API's fullPaymentFee.
 */
export function fullPaymentFee(totalFee: number, durationInMonths: number | null | undefined): number {
  const months = Number(durationInMonths ?? 0)
  if (!Number.isFinite(totalFee) || totalFee <= 0 || !Number.isFinite(months) || months < 2) return totalFee
  return totalFee - Math.round(totalFee / months)
}

/** What the applicant pays for one course now and one month later under a plan (matches the API's schedule). */
export function courseFeeBreakdown(
  totalFee: number,
  durationInMonths: number | null | undefined,
  plan: EnrollmentPaymentPlan
): { payNow: number; later: number; discount: number } {
  if (plan === "FULL") {
    const payNow = fullPaymentFee(totalFee, durationInMonths)
    return { payNow, later: 0, discount: totalFee - payNow }
  }
  const payNow = Math.ceil(totalFee / 2)
  return { payNow, later: totalFee - payNow, discount: 0 }
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

const feeScreenshotSchema = Yup.mixed()
  .required("Please attach a screenshot of your fee payment.")
  .test("fee-image", "Please attach an image file (PNG or JPG).", (v) => v instanceof File && v.type.startsWith("image/"))
  .test("fee-size", "Image must be under 5 MB.", (v) => v instanceof File && v.size <= 5 * 1024 * 1024)

export const enrollmentFormValidationSchema = contactFormValidationSchema.shape({
  paymentPlan: Yup.string()
    .oneOf(["FULL", "TWO_INSTALLMENTS"])
    .required("Choose how you'll pay."),
  feeScreenshot: feeScreenshotSchema,
})

/** Same rules, but no screenshot when the picked courses cost nothing (free courses or a 100% code). */
export function enrollmentFormValidationSchemaFor(needsPayment: (courses: ContactFormValues["courses"]) => boolean) {
  return contactFormValidationSchema.shape({
    paymentPlan: Yup.string()
      .oneOf(["FULL", "TWO_INSTALLMENTS"])
      .required("Choose how you'll pay."),
    feeScreenshot: Yup.mixed().when("courses", (values: unknown[], schema) =>
      needsPayment((values[0] as ContactFormValues["courses"] | undefined) ?? []) ? feeScreenshotSchema : schema.nullable().notRequired()
    ),
  })
}

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
