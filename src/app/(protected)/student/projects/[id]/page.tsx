import { StudentProjectScreen } from "@/lib/ui/screens/careers/projects"

export default async function StudentProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <StudentProjectScreen id={id} />
}
