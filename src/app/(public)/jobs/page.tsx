import type { Metadata } from "next"

import { JsonLd, breadcrumbLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { JobsBoardScreen } from "@/lib/ui/screens/jobs/public"

export const metadata: Metadata = pageMetadata({
  title: "Tech Jobs & Internships in Pakistan",
  description:
    "Browse developer, designer and e-commerce jobs and internships in Lahore and remote across Pakistan, from TechOn Skills partner software houses and public job boards. Apply in minutes.",
  path: "/jobs",
})

export default function JobsPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Jobs", path: "/jobs" }])} />
      <JobsBoardScreen />
    </>
  )
}
