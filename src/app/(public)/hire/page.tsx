import type { Metadata } from "next"

import { HireScreen } from "@/lib/ui/screens/jobs/public"

export const metadata: Metadata = {
  title: "Hire our students",
  description: "Post jobs and internships for TechOn Skills students for free.",
}

export default function HirePage() {
  return <HireScreen />
}
