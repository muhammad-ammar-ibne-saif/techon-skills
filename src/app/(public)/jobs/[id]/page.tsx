import type { Metadata } from "next"

import { JsonLd, breadcrumbLd, jobPostingLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { getSeoJob } from "@/lib/seo/server-api"
import { snippet } from "@/lib/seo/site"
import { JobDetailScreen } from "@/lib/ui/screens/jobs/public"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const j = await getSeoJob(id)
  if (!j) return { title: "Job", robots: { index: false, follow: true } }
  const company = j.company?.name || j.companyName
  const where = j.workMode === "REMOTE" ? "Remote" : j.location || "Lahore"
  return pageMetadata({
    title: `${j.title} at ${company} (${where})`,
    description: snippet(`${j.title} at ${company}, ${where}. ${j.description}`),
    path: `/jobs/${j.id}`,
    image: "route",
    // Imported and closed jobs stay reachable by link but are not indexed.
    noindex: j.source === "FEED" || j.status !== "OPEN",
  })
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params
  const j = await getSeoJob(id)
  const posting = j ? jobPostingLd(j) : null
  return (
    <>
      {j && (
        <JsonLd
          data={[
            ...(posting ? [posting] : []),
            breadcrumbLd([
              { name: "Jobs", path: "/jobs" },
              { name: j.title, path: `/jobs/${j.id}` },
            ]),
          ]}
        />
      )}
      <JobDetailScreen id={id} />
    </>
  )
}
