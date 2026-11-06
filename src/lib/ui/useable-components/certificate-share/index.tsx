"use client"

import { useState } from "react"
import { CheckIcon, LinkIcon, Share2Icon } from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"

const ORGANIZATION = "TechOn Skills"

/** Public page anyone can open to check the certificate is genuine. */
export function certificateVerifyUrl(code: string) {
  const base = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "https://techonskills.com"
  return `${base.replace(/\/$/, "")}/certificates/verify/${encodeURIComponent(code)}`
}

/** LinkedIn's "Add licence or certification" form, filled in. */
export function linkedInAddToProfileUrl(cert: { courseName: string; verificationCode: string; issuedAt?: string | null }) {
  const issued = cert.issuedAt ? new Date(cert.issuedAt) : new Date()
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.courseName,
    organizationName: ORGANIZATION,
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certUrl: certificateVerifyUrl(cert.verificationCode),
    certId: cert.verificationCode,
  })
  return `https://www.linkedin.com/profile/add?${params}`
}

/** LinkedIn post with the verify page as the shared link. */
export function linkedInSharePostUrl(code: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: certificateVerifyUrl(code) })}`
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

/** Add-to-LinkedIn, share-a-post and copy-link buttons for a live certificate. */
export function CertificateShareButtons({
  cert,
  compact = false,
}: {
  cert: { courseName: string; verificationCode: string; issuedAt?: string | null }
  compact?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(certificateVerifyUrl(cert.verificationCode))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copy this link:", certificateVerifyUrl(cert.verificationCode))
    }
  }
  const size = compact ? "xs" : "sm"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size={size} shape="pill" className="bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90">
        <a href={linkedInAddToProfileUrl(cert)} target="_blank" rel="noopener noreferrer">
          <LinkedInMark /> {compact ? "Add to LinkedIn" : "Add to LinkedIn profile"}
        </a>
      </Button>
      {!compact && (
        <Button asChild size={size} shape="pill" variant="outline">
          <a href={linkedInSharePostUrl(cert.verificationCode)} target="_blank" rel="noopener noreferrer">
            <Share2Icon className="size-4" /> Share a post
          </a>
        </Button>
      )}
      <Button size={size} shape="pill" variant="outline" onClick={() => void copy()}>
        {copied ? <CheckIcon className="size-4" /> : <LinkIcon className="size-4" />}
        {copied ? "Copied" : "Copy verify link"}
      </Button>
    </div>
  )
}
