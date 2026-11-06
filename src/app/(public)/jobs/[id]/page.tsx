import { JobDetailScreen } from "@/lib/ui/screens/jobs/public"

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <JobDetailScreen id={id} />
}
