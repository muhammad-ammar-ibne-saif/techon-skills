import type { Metadata } from "next"

import { JsonLd, breadcrumbLd, companyLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { getSeoCompany } from "@/lib/seo/server-api"
import { snippet } from "@/lib/seo/site"
import { CompanyPageScreen } from "@/lib/ui/screens/jobs/public"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const c = await getSeoCompany(slug)
  if (!c) return { title: "Company", robots: { index: false, follow: true } }
  const jobs = c.openJobsCount === 1 ? "1 open job" : `${c.openJobsCount} open jobs`
  return pageMetadata({
    title: `${c.name}: Jobs & Company Profile`,
    description: snippet(`${c.name}${c.city ? `, ${c.city}` : ""}. ${jobs} on TechOn Skills. ${c.about}`),
    path: `/companies/${c.slug}`,
    image: c.logo || null,
  })
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params
  const c = await getSeoCompany(slug)
  return (
    <>
      {c && (
        <JsonLd
          data={[
            companyLd(c),
            breadcrumbLd([
              { name: "Jobs", path: "/jobs" },
              { name: c.name, path: `/companies/${c.slug}` },
            ]),
          ]}
        />
      )}
      <CompanyPageScreen slug={slug} />
    </>
  )
}
