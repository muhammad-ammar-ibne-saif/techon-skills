"use client"

import { useQuery } from "@apollo/client/react"
import { Loader2Icon, ShieldCheckIcon, ShieldXIcon } from "lucide-react"

import { CertificateView, toCertificateViewData, type CertificateApiFields, type CertificateTemplateFields } from "@/lib/ui/useable-components/certificate-view"
import { VERIFY_CERTIFICATE } from "@/lib/graphql"
import { SectionLabel } from "@/lib/ui/useable-components/site-chrome/ui"

export const PublicCertificateVerifyScreen = ({ code }: { code: string }) => {
  const { data, loading, error } = useQuery<{
    verifyCertificate: {
      verificationCode: string
      studentName: string
      courseName: string
      percentage: number
      grade: string
      message: string
      status: string
      issuedAt: string | null
      template?: CertificateTemplateFields | null
      details?: CertificateApiFields["details"]
    } | null
  }>(VERIFY_CERTIFICATE, {
    variables: { code: code.toUpperCase() },
    skip: !code,
    fetchPolicy: "network-only",
  })

  const cert = data?.verifyCertificate

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-(--site-accent)" />
      </div>
    )
  }

  if (error || !cert) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <ShieldXIcon className="text-destructive mb-4 size-12" />
        <SectionLabel>{"// certificate check"}</SectionLabel>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Certificate not found</h1>
        <p className="text-muted-foreground mt-2">
          This verification code is invalid or the certificate has not been published yet.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <SectionLabel>{`// certificate check · ${cert.verificationCode}`}</SectionLabel>
        <h1 className="mt-3 inline-flex items-center gap-2 text-3xl font-semibold tracking-[-0.03em]">
          <ShieldCheckIcon className="size-7 text-emerald-600 dark:text-emerald-400" aria-hidden />
          Verified certificate
        </h1>
      </div>
      <CertificateView
        data={toCertificateViewData(cert)}
        pendingBadge={false}
      />
      {cert.issuedAt && (
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Issued on {new Date(cert.issuedAt).toLocaleDateString(undefined, { dateStyle: "long" })}
        </p>
      )}
    </div>
  )
}
