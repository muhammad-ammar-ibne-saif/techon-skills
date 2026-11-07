import { CAREER_TABS, StudentCareerHub, type CareerTab } from "@/lib/ui/screens/careers/student"

export default async function StudentJobsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const known = CAREER_TABS.some((t) => t.key === tab)
  return <StudentCareerHub tab={known ? (tab as CareerTab) : "for-you"} />
}
