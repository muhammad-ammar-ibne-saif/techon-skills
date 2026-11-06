import { CompanyPageScreen } from "@/lib/ui/screens/jobs/public"

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <CompanyPageScreen slug={slug} />
}
