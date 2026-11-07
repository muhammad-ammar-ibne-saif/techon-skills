import type { Metadata } from "next"
import { PublicCertificateVerifyScreen } from "@/lib/ui/screens/public/certificates/verify"

const SITE_NAME = "TechOn Skills"
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://techonskills.com"

type Props = { params: Promise<{ code: string }> }

/** Just enough of the certificate for link previews (LinkedIn, WhatsApp). */
async function getCertificate(code: string): Promise<{ studentName: string; courseName: string; grade: string; status: string } | null> {
  const url = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || "http://localhost:8080/graphql-techonskills"
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query VerifyCertificateMeta($code: String!) { verifyCertificate(code: $code) { studentName courseName grade status } }`,
        variables: { code },
      }),
      next: { revalidate: 300 },
    })
    const json = await res.json()
    return json?.data?.verifyCertificate ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const cert = await getCertificate(code)
  // Certificates are shareable but kept out of search results to protect students' privacy.
  const robots = { index: false, follow: false }
  if (!cert || cert.status !== "live") return { title: "Verify certificate", robots }
  const title = `${cert.studentName} — ${cert.courseName} certificate`
  const description = `${cert.studentName} completed ${cert.courseName} at ${SITE_NAME} (grade ${cert.grade}). Verified certificate.`
  const url = `${BASE_URL}/certificates/verify/${encodeURIComponent(code)}`
  return {
    title,
    robots,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function CertificateVerifyPage({ params }: Props) {
  const { code } = await params
  return <PublicCertificateVerifyScreen code={code} />
}
