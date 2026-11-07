"use client"

import Link from "next/link"
import { useQuery } from "@apollo/client/react"
import { ArrowLeftIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { CertificateView, toCertificateViewData, type CertificateApiFields, type CertificateTemplateFields } from "@/lib/ui/useable-components/certificate-view"
import { CertificateShareButtons } from "@/lib/ui/useable-components/certificate-share"
import { GET_CERTIFICATE_BY_ID } from "@/lib/graphql"
import { CONFIG } from "@/utils/constants"

export const StudentCertificateDetailScreen = ({ certificateId }: { certificateId: string }) => {
  const { data, loading, error } = useQuery<{
    getCertificateById: {
      id: string
      verificationCode: string
      studentName: string
      courseName: string
      percentage: number
      grade: string
      message: string
      status: string
      issuedAt?: string | null
      template?: CertificateTemplateFields | null
      details?: CertificateApiFields["details"]
    } | null
  }>(GET_CERTIFICATE_BY_ID, {
    variables: { id: certificateId },
    skip: !certificateId,
    fetchPolicy: "network-only",
  })

  const cert = data?.getCertificateById

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2Icon className="size-10 animate-spin text-(--brand-highlight)" />
      </div>
    )
  }

  if (error || !cert) {
    return (
      <div className="py-10 text-center">
        <p className="text-destructive">{error?.message ?? "Certificate not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={CONFIG.ROUTES.STUDENT.CERTIFICATES}>Back to certificates</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href={CONFIG.ROUTES.STUDENT.CERTIFICATES}>
          <ArrowLeftIcon className="mr-2 size-4" />
          All certificates
        </Link>
      </Button>
      {cert.status === "live" && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold">Show it off</div>
            <p className="text-muted-foreground text-sm">
              Add it to your LinkedIn profile. Anyone can confirm it&apos;s genuine through the verify link.
            </p>
          </div>
          <CertificateShareButtons cert={cert} />
        </div>
      )}
      <CertificateView
        data={toCertificateViewData(cert)}
        showQr={cert.status === "live"}
        pendingBadge
      />
    </div>
  )
}
