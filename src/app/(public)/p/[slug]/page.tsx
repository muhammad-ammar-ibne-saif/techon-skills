import type { Metadata } from "next"

import { JsonLd, profileLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { getSeoPortfolio } from "@/lib/seo/server-api"
import { snippet } from "@/lib/seo/site"
import { PortfolioPageScreen } from "@/lib/ui/screens/jobs/public"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getSeoPortfolio(slug)
  if (!p) return { title: "Portfolio", robots: { index: false, follow: false } }
  return pageMetadata({
    title: `${p.fullName}${p.headline ? `, ${p.headline}` : ""}: Portfolio`,
    description: snippet(
      p.bio || `${p.fullName}'s portfolio: projects, skills${p.skills.length ? ` (${p.skills.slice(0, 6).join(", ")})` : ""} and verified TechOn Skills certificates.`
    ),
    path: `/p/${p.slug}`,
    image: "route",
    type: "profile",
  })
}

export default async function PortfolioPage({ params }: Props) {
  const { slug } = await params
  const p = await getSeoPortfolio(slug)
  return (
    <>
      {p && <JsonLd data={profileLd(p)} />}
      <PortfolioPageScreen slug={slug} />
    </>
  )
}
