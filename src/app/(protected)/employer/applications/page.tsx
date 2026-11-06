import { EmployerApplicationsScreen } from "@/lib/ui/screens/jobs/employer"

export default async function EmployerApplicationsPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { job } = await searchParams
  return <EmployerApplicationsScreen initialJobId={job ?? ""} />
}
