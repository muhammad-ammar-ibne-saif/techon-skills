"use client"

import type { FormEvent } from "react"
import { startTransition, useEffect, useState } from "react"
import { Formik, getIn, type FormikTouched } from "formik"
import toast from "react-hot-toast"

import { cn, getApiDisplayMessage, logger } from "@/lib/helpers"
import {
  enrollmentFormValidationSchema,
  getEnrollmentFormInitialValues,
  readFeeScreenshotAsDataUrl,
  type EnrollmentFormValues,
} from "@/lib/helpers/contact-form"
import { apiService } from "@/lib/services/api"
import { getConfig } from "@/lib/services/config"
import { Button } from "@/lib/ui/useable-components/button"
import { CourseMultiSelect } from "@/lib/ui/useable-components/course-multi-select"
import {
  ContactCourseFeesSummary,
  formatFee,
  useEnrollmentFees,
} from "@/lib/ui/useable-components/contact-course-fees-summary"
import { Input } from "@/lib/ui/useable-components/input"
import { PhoneInput, getFullPhone, type PhoneValue } from "@/lib/ui/useable-components/phone-input"
import { Separator } from "@/lib/ui/useable-components/separator"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { FormSubmitSuccess } from "@/lib/ui/useable-components/form-submit-success"
import { CONFIG, SITE_PHONE_DISPLAY, SITE_WHATSAPP_URL } from "@/utils/constants"
import type { IContactFormCourse, IEnrollmentApplicationSubmit } from "@/utils/interfaces"
import { LoggerLevel } from "@/utils/enums"

const PAYMENT_PLAN_OPTIONS = [
  { value: "FULL", label: "Full payment", hint: "One month's fee off" },
  { value: "TWO_INSTALLMENTS", label: "2 installments", hint: "Half now, half next month" },
] as const

/** The two payment-plan cards, with each plan's amounts once courses are picked. */
function PaymentPlanOptions({
  courses,
  value,
  onChange,
}: {
  courses: IContactFormCourse[]
  value: string
  onChange: (plan: (typeof PAYMENT_PLAN_OPTIONS)[number]["value"]) => void
}) {
  const { currency, totals } = useEnrollmentFees(courses)
  const amounts = (plan: (typeof PAYMENT_PLAN_OPTIONS)[number]["value"]) => {
    const t = totals[plan]
    if (!t) return null
    if (plan === "FULL")
      return t.discount > 0 ? (
        <>
          <span className="text-foreground font-semibold">{formatFee(currency, t.payNow)}</span>{" "}
          <span className="line-through">{formatFee(currency, t.courseFee)}</span>{" "}
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Save {formatFee(currency, t.discount)}</span>
        </>
      ) : (
        <span className="text-foreground font-semibold">{formatFee(currency, t.payNow)}</span>
      )
    return (
      <>
        <span className="text-foreground font-semibold">{formatFee(currency, t.payNow)}</span> now +{" "}
        {formatFee(currency, t.later)} next month
      </>
    )
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PAYMENT_PLAN_OPTIONS.map((o) => (
        <label
          key={o.value}
          className={cn(
            "flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-sm transition-colors",
            value === o.value ? "border-(--brand-primary) bg-(--brand-primary)/10" : "border-border hover:bg-muted/40"
          )}
        >
          <span className="flex items-center gap-2 font-medium">
            <input
              type="radio"
              name="paymentPlan"
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="accent-(--brand-primary)"
            />
            {o.label}
          </span>
          <span className="text-muted-foreground text-xs">{amounts(o.value) ?? o.hint}</span>
        </label>
      ))}
    </div>
  )
}

type EnrollmentFormCardProps = {
  initialCourse?: { slug: string; title: string } | null
  /** `modal` matches landing field styling for the first-visit dialog. */
  variant?: "page" | "landing" | "modal"
  sent?: boolean
  onSuccess?: () => void
}

export function EnrollmentFormCard({
  initialCourse = null,
  variant = "page",
  sent = false,
  onSuccess,
}: EnrollmentFormCardProps) {
  const [sessionDone, setSessionDone] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      if (sessionStorage.getItem(CONFIG.STORAGE_KEYS.SESSION.ENROLLMENT_FORM_SUBMITTED) === "1") {
        startTransition(() => setSessionDone(true))
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, [])
  const showSuccess = sessionDone || sent

  const softSurface = variant === "landing" || variant === "modal"

  const softInput = (invalid: boolean) =>
    cn(
      "rounded-xl border-border bg-muted/40 transition-colors focus-within:bg-background dark:bg-muted/25",
      invalid && "border-destructive"
    )
  const pageInput = (invalid: boolean) => cn(invalid && "border-destructive")

  const inputCls = softSurface ? softInput : pageInput

  const submitEnrollment = async (values: EnrollmentFormValues) => {
    if (!getConfig().BACKEND_URL?.trim()) {
      toast.error("Server URL is not configured. Set NEXT_PUBLIC_BACKEND_URL and restart the dev server.")
      return false
    }
    const name = [values.firstName, values.lastName].filter(Boolean).join(" ").trim()
    let feePaymentScreenshotDataUrl: string | undefined
    if (values.feeScreenshot instanceof File) {
      feePaymentScreenshotDataUrl = await readFeeScreenshotAsDataUrl(values.feeScreenshot)
    }
    const payload: IEnrollmentApplicationSubmit = {
      name,
      email: values.email,
      courses: values.courses,
      message: values.message,
      phone: getFullPhone(values.phone),
      paymentPlan: values.paymentPlan,
      feePaymentScreenshotDataUrl: feePaymentScreenshotDataUrl ?? "",
    }
    const toastId = toast.loading("Submitting enrollment…")
    logger({
      type: LoggerLevel.DEBUG,
      message: "Submitting enrollment application",
      error: JSON.stringify({ ...payload, feePaymentScreenshotDataUrl: payload.feePaymentScreenshotDataUrl ? "[image data]" : undefined }),
    })
    let response: Awaited<ReturnType<typeof apiService.submitEnrollmentApplication>>
    try {
      response = await apiService.submitEnrollmentApplication(payload)
    } catch (e) {
      toast.dismiss(toastId)
      logger({ type: LoggerLevel.ERROR, message: "Enrollment submit failed", error: String(e) })
      toast.error("Could not reach the server. Check your connection and try again.")
      return false
    }
    toast.dismiss(toastId)
    if (response.success) {
      toast.success(
        getApiDisplayMessage(
          response,
          "Registration received. You can sign in after an admin approves your account."
        )
      )
      try {
        sessionStorage.setItem(CONFIG.STORAGE_KEYS.SESSION.ENROLLMENT_FORM_SUBMITTED, "1")
      } catch {
        /* ignore */
      }
      setSessionDone(true)
      onSuccess?.()
    } else {
      toast.error(getApiDisplayMessage(response, "Failed to submit. Please try again."))
    }
    return response.success
  }

  const phoneWrap = softSurface
    ? "[&_select]:rounded-l-xl [&_input]:rounded-r-xl [&_select]:border-border [&_input]:border-border [&_select]:bg-muted/40 [&_input]:bg-muted/40 dark:[&_select]:bg-muted/25 dark:[&_input]:bg-muted/25"
    : undefined

  const fileInputClass =
    "text-muted-foreground w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-(--brand-primary)/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"

  if (showSuccess) {
    return (
      <FormSubmitSuccess
        title="Application received"
        description="Your enrollment was submitted. We'll review your payment proof and contact you after approval."
      />
    )
  }

  return (
    <Formik
      initialValues={getEnrollmentFormInitialValues(initialCourse ?? undefined)}
      validationSchema={enrollmentFormValidationSchema}
      enableReinitialize
      onSubmit={async (values, { resetForm, setSubmitting }) => {
        const success = await submitEnrollment(values)
        setSubmitting(false)
        if (success)
          resetForm({ values: getEnrollmentFormInitialValues(initialCourse ?? undefined), touched: {}, errors: {} })
      }}
      validateOnBlur={false}
      validateOnChange={false}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched, setTouched, submitForm }) => {
        const phoneError =
          getIn(errors, "phone.number") ?? getIn(errors, "phone.countryCode") ?? (typeof errors.phone === "string" ? errors.phone : undefined)
        const markAllTouchedAndSubmit = async (e: FormEvent<HTMLFormElement>) => {
          e.preventDefault()
          await setTouched(
            {
              firstName: true,
              lastName: true,
              email: true,
              phone: { countryCode: true, number: true },
              courses:
                values.courses.length > 0
                  ? values.courses.map(() => ({ slug: true, title: true }))
                  : true,
              feeScreenshot: true,
              message: true,
            } as FormikTouched<EnrollmentFormValues>,
            false
          )
          await submitForm()
        }

        return (
        <form className="space-y-4" noValidate action="#" onSubmit={markAllTouchedAndSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="w-full">
              <Input
                placeholder="First name"
                name="firstName"
                value={values.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!(touched.firstName && errors.firstName)}
                className={inputCls(!!(touched.firstName && errors.firstName))}
              />
              {touched.firstName && errors.firstName && (
                <p className="text-destructive mt-1 text-xs">{errors.firstName}</p>
              )}
            </div>
            <div className="w-full">
              <Input
                placeholder="Last name"
                name="lastName"
                value={values.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={!!(touched.lastName && errors.lastName)}
                className={inputCls(!!(touched.lastName && errors.lastName))}
              />
              {touched.lastName && errors.lastName && (
                <p className="text-destructive mt-1 text-xs">{errors.lastName}</p>
              )}
            </div>
          </div>
          <div className="w-full">
            <Input
              placeholder="Your email"
              name="email"
              type="email"
              required
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!(touched.email && errors.email)}
              className={inputCls(!!(touched.email && errors.email))}
            />
            {touched.email && errors.email && <p className="text-destructive mt-1 text-xs">{errors.email}</p>}
          </div>
          <div className="w-full">
            <PhoneInput
              value={values.phone}
              onChange={(phone: PhoneValue) => setFieldValue("phone", phone)}
              onBlur={() => setFieldTouched("phone", true)}
              touched={!!touched.phone}
              placeholder="Phone number"
              required
              aria-invalid={!!(touched.phone && phoneError)}
              suppressErrorMessage
              className={phoneWrap}
            />
            {touched.phone && phoneError && <p className="text-destructive mt-1 text-xs">{phoneError}</p>}
          </div>
          <div className="w-full">
            <CourseMultiSelect
              value={values.courses}
              onChange={(courses: IContactFormCourse[]) => setFieldValue("courses", courses)}
              placeholder="Search and select courses…"
              required
            />
            {touched.courses && typeof errors.courses === "string" && (
              <p className="text-destructive mt-1 text-xs">{errors.courses}</p>
            )}
          </div>
          <fieldset className="w-full">
            <legend className="text-muted-foreground mb-1.5 text-xs font-medium">How will you pay? *</legend>
            <PaymentPlanOptions
              courses={values.courses}
              value={values.paymentPlan}
              onChange={(plan) => setFieldValue("paymentPlan", plan)}
            />
            <ContactCourseFeesSummary
              selectedCourses={values.courses}
              paymentPlan={values.paymentPlan}
              className="mt-3"
            />
          </fieldset>
          <div className="w-full">
            <div className="text-muted-foreground mb-1.5 text-xs font-medium">Fee payment screenshot *</div>
            <input
              type="file"
              accept="image/*"
              className={fileInputClass}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setFieldValue("feeScreenshot", f)
                setFieldTouched("feeScreenshot", true)
              }}
            />
            {touched.feeScreenshot && typeof errors.feeScreenshot === "string" && (
              <p className="text-destructive mt-1 text-xs">{errors.feeScreenshot}</p>
            )}
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Upload proof that matches the &quot;Pay now&quot; total shown above (one screenshot is enough).
            </p>
          </div>
          <Textarea
            placeholder="Message (optional context)"
            className={
              softSurface
                ? "min-h-40 rounded-xl border-border bg-muted/40 transition-colors focus:bg-background dark:bg-muted/25"
                : "min-h-44"
            }
            name="message"
            value={values.message}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {softSurface && <Separator />}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Questions? {SITE_PHONE_DISPLAY}</span>
              <Button variant="outline" size="sm" shape="pill" asChild>
                <a
                  href={SITE_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </Button>
            </div>
            <Button variant="brand-secondary" shape="pill" className="w-fit" type="submit">
              Submit enrollment
            </Button>
          </div>
        </form>
        )
      }}
    </Formik>
  )
}
