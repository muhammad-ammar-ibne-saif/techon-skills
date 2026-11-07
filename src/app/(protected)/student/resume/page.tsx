import { StudentResumeScreen } from "@/lib/ui/screens/resume/editor"

export default async function StudentResumePage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { job } = await searchParams
  return <StudentResumeScreen jobId={job || undefined} />
}
