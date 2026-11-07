import { InterviewPracticeScreen } from "@/lib/ui/screens/careers/practice"

export default async function InterviewPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InterviewPracticeScreen id={id} />
}
