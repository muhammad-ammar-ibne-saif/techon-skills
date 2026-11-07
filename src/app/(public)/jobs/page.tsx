import type { Metadata } from "next"

import { JobsBoardScreen } from "@/lib/ui/screens/jobs/public"

export const metadata: Metadata = {
  title: "Jobs",
  description: "Jobs and internships for TechOn Skills students, from our partner software houses and public job boards.",
}

export default function JobsPage() {
  return <JobsBoardScreen />
}
