import { OG_CONTENT_TYPE, OG_SIZE, brandCard } from "@/lib/seo/og"
import { SITE } from "@/lib/seo/site"

export const alt = `${SITE.name}: ${SITE.headline}`
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return brandCard({
    eyebrow: "AI-powered tech institute · Lahore",
    title: "Learn with AI. Build real software. Get hired.",
    subtitle: "Live online classes, graded projects, AI mock interviews and an AI resume builder.",
    chips: ["Web & mobile apps", "Software engineering", "AI career tools"],
  })
}
