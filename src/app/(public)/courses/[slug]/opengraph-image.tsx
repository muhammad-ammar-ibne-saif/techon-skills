import { OG_CONTENT_TYPE, OG_SIZE, brandCard } from "@/lib/seo/og"
import { getSeoCourse } from "@/lib/seo/server-api"

export const alt = "TechOn Skills course"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = await getSeoCourse(slug)
  if (!c) return brandCard({ eyebrow: "Course", title: "TechOn Skills courses" })
  const fee = c.isFree ? "Free" : `${c.currency || "PKR"} ${c.feePerMonth.toLocaleString("en-US")}/month`
  return brandCard({
    eyebrow: `${c.courseDurationInMonths}-month course · ${fee}`,
    title: c.title,
    subtitle: c.subtitle || c.heroDescription,
    chips: c.technologies.map((t) => t.label).filter(Boolean),
  })
}
