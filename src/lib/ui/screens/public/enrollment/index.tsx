"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"

import { cn } from "@/lib/helpers"
import { useCourses } from "@/lib/providers/courses"
import { CONFIG } from "@/utils/constants"
import { EnrollmentFormCard } from "@/lib/ui/screens/public/enrollment/enrollment-form-card"
import { SectionLabel, siteContainer, siteDotGrid } from "@/lib/ui/useable-components/site-chrome/ui"

export { EnrollmentFormCard } from "@/lib/ui/screens/public/enrollment/enrollment-form-card"

const STEPS = [
  "Fill in your details",
  "Pick course(s) and how you'll pay",
  "Pay the amount shown and upload the receipt",
  "We confirm your payment and activate your account",
]

export function PublicEnrollmentScreen() {
  const searchParams = useSearchParams()
  const courseSlug = searchParams.get("course")
  const { getCourseBySlug } = useCourses()
  const course = courseSlug ? getCourseBySlug(courseSlug) : undefined
  const initialCourse = course != null ? { slug: course.slug, title: course.title } : null
  const initialCourses = (searchParams.get("courses") ?? "")
    .split(",")
    .map((s) => getCourseBySlug(s.trim()))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .slice(0, 10)
    .map((c) => ({ slug: c.slug, title: c.title }))
  const picked = initialCourses.length ? initialCourses : initialCourse ? [initialCourse] : []

  return (
    <section className={cn("border-border/60 border-b", siteDotGrid)}>
      <div className={cn(siteContainer, "grid gap-12 py-14 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-start")}>
        <div className="lg:sticky lg:top-24">
          <SectionLabel>{"// enrollment"}</SectionLabel>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.25rem]">
            Enroll in a few steps.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-[15px] leading-relaxed">
            Pick your course, pay the fee and upload your receipt. We activate your account as soon as the payment is confirmed.
          </p>
          {picked.length > 0 && (
            <p className="mt-4 text-sm">
              Selected: <span className="font-semibold text-(--site-accent)">{picked.map((c) => c.title).join(", ")}</span>. You
              can add or change courses in the form.
            </p>
          )}
          <ol className="border-border mt-8 border-t">
            {STEPS.map((s, i) => (
              <li key={s} className="border-border flex gap-4 border-b py-2.5 font-mono text-xs">
                <span className="text-(--site-accent)">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
          <Link
            href={CONFIG.ROUTES.PUBLIC.COURSES}
            className="text-muted-foreground hover:text-foreground mt-6 inline-block font-mono text-[11px]"
          >
            browse all courses →
          </Link>
        </div>

        <div className="border-border bg-card rounded-xl border shadow-[0_24px_60px_-28px_rgba(15,15,40,0.35)]">
          <div className="border-border text-muted-foreground border-b px-6 py-3 font-mono text-[10px]">
            enrollment form · reviewed by an admin
          </div>
          <div className="p-6 sm:p-8">
            <EnrollmentFormCard initialCourse={initialCourse} initialCourses={initialCourses} variant="page" />
          </div>
        </div>
      </div>
    </section>
  )
}
