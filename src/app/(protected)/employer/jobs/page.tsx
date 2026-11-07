import { EmployerJobsScreen } from "@/lib/ui/screens/jobs/employer"

export default async function EmployerJobsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { new: startNew } = await searchParams
  return <EmployerJobsScreen startNew={startNew === "1"} />
}
