import type { Metadata } from "next"
import { Suspense } from "react"

import { JsonLd, breadcrumbLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { PublicEnrollmentScreen } from "@/lib/ui/screens/public/enrollment"

export const metadata: Metadata = pageMetadata({
  title: "Enroll in a Course",
  description:
    "Enroll at TechOn Skills in a few minutes: pick your course, see your first-month fee, pay by bank transfer or mobile wallet and upload the receipt.",
  path: "/enrollment",
})

export default function EnrollmentPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Enrollment", path: "/enrollment" }])} />
      <Suspense fallback={<div className="w-full px-4 py-12 sm:px-6 lg:px-8 2xl:px-10">Loading…</div>}>
        <PublicEnrollmentScreen />
      </Suspense>
    </>
  )
}
