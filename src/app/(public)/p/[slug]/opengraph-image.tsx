import { OG_CONTENT_TYPE, OG_SIZE, brandCard } from "@/lib/seo/og"
import { getSeoPortfolio } from "@/lib/seo/server-api"

export const alt = "Student portfolio on TechOn Skills"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await getSeoPortfolio(slug)
  if (!p) return brandCard({ eyebrow: "Portfolio", title: "TechOn Skills student portfolios" })
  return brandCard({
    eyebrow: p.openToWork ? "Portfolio · Open to work" : "Portfolio",
    title: p.fullName,
    subtitle: p.headline || p.courses.join(" · "),
    chips: p.skills,
  })
}
