import { OG_CONTENT_TYPE, OG_SIZE, brandCard } from "@/lib/seo/og"
import { getSeoJob } from "@/lib/seo/server-api"

export const alt = "Job at TechOn Skills job board"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

const TYPE: Record<string, string> = { FULL_TIME: "Full-time", PART_TIME: "Part-time", INTERNSHIP: "Internship", CONTRACT: "Contract" }
const MODE: Record<string, string> = { ONSITE: "On-site", REMOTE: "Remote", HYBRID: "Hybrid" }

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const j = await getSeoJob(id)
  if (!j) return brandCard({ eyebrow: "Jobs", title: "Jobs and internships for TechOn Skills students" })
  return brandCard({
    eyebrow: `${TYPE[j.jobType] ?? "Job"} · ${MODE[j.workMode] ?? ""}`,
    title: j.title,
    subtitle: [j.companyName, j.location].filter(Boolean).join(" · "),
    chips: j.skills,
  })
}
