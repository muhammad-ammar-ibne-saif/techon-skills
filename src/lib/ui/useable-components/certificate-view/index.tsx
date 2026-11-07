"use client"

import Image from "next/image"
import { cn, getImageSrc } from "@/lib/helpers"
import { QrCode } from "@/lib/ui/useable-components/qr-code"

export type CertificateViewData = {
  studentName: string
  courseName: string
  percentage: number
  grade: string
  message: string
  verificationCode: string
  status?: string
  titleLine?: string
  subtitleLine?: string
  footerLine?: string
  verifyBaseUrl?: string
}

function buildVerifyUrl(code: string, verifyBaseUrl?: string) {
  const base =
    verifyBaseUrl ??
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://techonskills.com")
  return `${base.replace(/\/$/, "")}/certificates/verify/${code}`
}

export function CertificateView({
  data,
  className,
  showQr = true,
  pendingBadge = true,
}: {
  data: CertificateViewData
  className?: string
  showQr?: boolean
  pendingBadge?: boolean
}) {
  const signatureUrl = getImageSrc("signatures/ceo.png")
  const verifyUrl = buildVerifyUrl(data.verificationCode, data.verifyBaseUrl)
  const isPending = data.status === "pending"

  return (
    <div
      className={cn(
        "relative mx-auto aspect-[1.414/1] w-full max-w-3xl overflow-hidden rounded-2xl border-4 border-(--brand-secondary)/40 bg-linear-to-br from-[#0a1628] via-[#0f2744] to-[#1a3a5c] p-8 text-white shadow-2xl sm:p-12",
        className
      )}
    >
      {pendingBadge && isPending && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-black">
          Pending approval
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute -left-20 -top-20 size-64 rounded-full bg-(--brand-highlight)" />
        <div className="absolute -bottom-16 -right-16 size-72 rounded-full bg-(--brand-secondary)" />
      </div>

      <div className="relative flex h-full flex-col items-center text-center">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-(--brand-highlight)">
          TechOn Skills
        </div>
        <h1 className="text-balance text-2xl font-bold tracking-wide sm:text-3xl">
          {data.titleLine ?? "Certificate of Completion"}
        </h1>
        <p className="mt-4 text-sm text-white/70 sm:text-base">
          {data.subtitleLine ?? "This is to certify that"}
        </p>
        <p className="mt-3 text-2xl font-semibold text-(--brand-highlight) sm:text-3xl">{data.studentName}</p>
        <p className="mt-6 max-w-xl text-pretty text-sm leading-relaxed text-white/85 sm:text-base">{data.message}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
          <span className="rounded-lg bg-white/10 px-3 py-1.5">
            Score: <strong>{data.percentage}%</strong>
          </span>
          <span className="rounded-lg bg-white/10 px-3 py-1.5">
            Grade: <strong>{data.grade}</strong>
          </span>
          <span className="rounded-lg bg-white/10 px-3 py-1.5">
            Course: <strong>{data.courseName}</strong>
          </span>
        </div>

        <div className="mt-auto flex w-full items-end justify-between gap-6 pt-8">
          <div className="flex flex-col items-start text-left">
            <Image
              src={signatureUrl}
              alt="CEO signature"
              width={160}
              height={64}
              className="h-14 w-auto object-contain brightness-0 invert"
              unoptimized
            />
            <div className="mt-1 border-t border-white/30 pt-1 text-xs text-white/70">Authorized Signatory</div>
          </div>

          {showQr && (
            <div className="flex flex-col items-center gap-1">
              <QrCode value={verifyUrl} size={88} label="Verification QR code" className="rounded-md bg-white p-1" />
              <span className="font-mono text-[10px] text-white/60">{data.verificationCode}</span>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-white/50">{data.footerLine ?? "TechOn Skills"}</p>
      </div>
    </div>
  )
}
