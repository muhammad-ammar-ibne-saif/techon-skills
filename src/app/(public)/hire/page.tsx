import type { Metadata } from "next"

import { JsonLd, breadcrumbLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { HireScreen } from "@/lib/ui/screens/jobs/public"

export const metadata: Metadata = pageMetadata({
  title: "Hire Trained Developers & Interns in Lahore",
  description:
    "Post jobs and internships for free and hire TechOn Skills students and graduates trained on real projects in web, mobile, software engineering and e-commerce. See verified portfolios and certificates.",
  path: "/hire",
})

export default function HirePage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Hire our students", path: "/hire" }])} />
      <HireScreen />
    </>
  )
}
