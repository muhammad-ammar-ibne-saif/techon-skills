import { PortfolioPageScreen } from "@/lib/ui/screens/jobs/public"

export default async function PortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <PortfolioPageScreen slug={slug} />
}
