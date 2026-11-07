"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Instrument_Serif } from "next/font/google"

import { cn, getImageSrc } from "@/lib/helpers"
import { BRAND } from "@/lib/ui/useable-components/brand-logo"
import { QrCode } from "@/lib/ui/useable-components/qr-code"

const nameFont = Instrument_Serif({ weight: "400", style: ["italic"], subsets: ["latin"], display: "swap" })

export type CertificateViewData = {
  studentName: string
  courseName: string
  percentage: number
  grade: string
  message?: string
  verificationCode: string
  status?: string
  issuedAt?: string | null
  titleLine?: string
  subtitleLine?: string
  footerLine?: string
  directorName?: string
  directorTitle?: string
  mentorName?: string
  mentorTitle?: string
  details?: { durationMonths: number | null; batchName: string | null; projectsGraded: number } | null
  verifyBaseUrl?: string
}

/** The certificate is drawn at A4 landscape size and scaled to fit, so it looks the same everywhere. */
const W = 1123
const H = 794

/** Always the public site's address (same on server and browser, and right for a printed QR code). */
function buildVerifyUrl(code: string, verifyBaseUrl?: string) {
  const base = verifyBaseUrl ?? (process.env.NEXT_PUBLIC_SITE_URL || "https://techonskills.com")
  return `${base.replace(/\/$/, "")}/certificates/verify/${code}`
}

const formatIssued = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "Not issued yet"

function detailsLine(d: CertificateViewData["details"]) {
  if (!d) return ""
  const parts: string[] = []
  if (d.durationMonths) parts.push(`${d.durationMonths} month${d.durationMonths === 1 ? "" : "s"}`)
  if (d.batchName) parts.push(d.batchName)
  if (d.projectsGraded) parts.push(`${d.projectsGraded} project${d.projectsGraded === 1 ? "" : "s"} graded`)
  return parts.join(" · ")
}

/** White tile with the blue cap, as on the certificate's side panel. */
function SideMark() {
  return (
    <svg viewBox="0 0 264 264" className="size-[92px]" aria-hidden>
      <rect width="264" height="264" rx="56" fill="#FFFFFF" />
      <rect x="119" y="120" width="26" height="102" rx="13" fill={BRAND.orange} />
      <path d="M25 93 132 42 239 93 132 140Z" fill={BRAND.blue} />
      <rect x="209" y="94" width="10" height="64" fill={BRAND.blue} />
      <circle cx="214" cy="165" r="13" fill={BRAND.orange} />
    </svg>
  )
}

/** Round "verified" seal with text around the edge. */
function Seal() {
  const ring = `seal-${useId().replace(/:/g, "")}`
  return (
    <svg viewBox="0 0 120 120" className="size-[120px]" aria-hidden>
      <defs>
        <path id={ring} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="58" fill={BRAND.blue} />
      <circle cx="60" cy="60" r="34" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1" />
      <text fill="#FFFFFF" fontSize="8" fontWeight="700" fontFamily="var(--font-geist-mono), monospace">
        {/* textLength spreads the words evenly round the whole ring (2πr ≈ 276) so the ends never overlap. */}
        <textPath href={`#${ring}`} textLength="270" lengthAdjust="spacing">
          TECHON SKILLS · VERIFIED · LEARN · BUILD · GROW ·
        </textPath>
      </text>
      <g transform="translate(38 38) scale(0.1667)">
        <rect x="119" y="120" width="26" height="102" rx="13" fill={BRAND.orange} />
        <path d="M25 93 132 42 239 93 132 140Z" fill="#FFFFFF" />
        <rect x="209" y="94" width="10" height="64" fill="#FFFFFF" />
        <circle cx="214" cy="165" r="13" fill={BRAND.orange} />
      </g>
    </svg>
  )
}

function Signature({ name, title, imageUrl }: { name?: string; title: string; imageUrl?: string }) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <div className="flex w-[190px] flex-col items-center text-center">
      <div className="flex h-[52px] items-end justify-center">
        {imageUrl && imgOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="max-h-[50px] w-auto object-contain" onError={() => setImgOk(false)} />
        )}
      </div>
      <div className="w-full border-t border-[#0E1116]" />
      <p className="mt-2 text-[15px] font-semibold text-[#0E1116]">{name || " "}</p>
      <p className="mt-0.5 font-mono text-[11px] text-[#4B5563]">{title}</p>
    </div>
  )
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
  const frame = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const verifyUrl = buildVerifyUrl(data.verificationCode, data.verifyBaseUrl)
  const shownUrl = verifyUrl.replace(/^https?:\/\//, "")
  const isPending = data.status === "pending"
  const facts = detailsLine(data.details)
  const pct = Math.max(0, Math.min(100, Math.round(data.percentage)))

  return (
    <div
      ref={frame}
      className={cn("relative mx-auto w-full max-w-5xl overflow-hidden rounded-md shadow-2xl print:shadow-none", className)}
      style={{ aspectRatio: `${W} / ${H}` }}
      role="img"
      aria-label={`Certificate of completion: ${data.studentName}, ${data.courseName}, ${pct}%, grade ${data.grade}. Code ${data.verificationCode}.`}
    >
      <div
        className="absolute top-0 left-0 flex bg-white text-[#0E1116]"
        style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}
        aria-hidden
      >
        {/* ---------------------------------------------------------------- side panel */}
        <aside
          className="relative flex w-[236px] shrink-0 flex-col items-center py-[52px] text-white"
          style={{
            backgroundColor: BRAND.blue,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <SideMark />
          <p className="mt-3 text-[30px] leading-none font-extrabold tracking-[-0.04em]">TechOn</p>
          <p className="mt-2 text-[12px] font-semibold tracking-[0.45em]">SKILLS</p>

          <div className="mt-auto mb-auto flex flex-col items-center">
            <p className="font-mono text-[11px] font-semibold tracking-[0.2em]">FINAL MARK</p>
            <div className="mt-3 flex size-[138px] flex-col items-center justify-center rounded-full bg-white ring-[7px] ring-white/30">
              <span className="text-[50px] leading-none font-extrabold tracking-[-0.03em]" style={{ color: BRAND.blue }}>
                {pct}
              </span>
              <span className="mt-1 font-mono text-[11px] text-[#4B5563]">/ 100</span>
            </div>
            <p className="mt-4 font-mono text-[12px] font-semibold tracking-[0.2em]">GRADE {data.grade}</p>
          </div>

          <p className="text-center font-mono text-[11px] leading-[1.9] font-semibold tracking-[0.2em]">
            LEARN.
            <br />
            BUILD.
            <br />
            GROW.
          </p>
        </aside>

        {/* ---------------------------------------------------------------- main panel */}
        <div className="flex-1 p-[32px]">
          <div className="h-full border border-[#0E1116] p-[8px]">
            <div className="flex h-full flex-col border border-[#E5E7EB] px-[34px] pt-[28px] pb-[16px]">
              <div className="flex items-start justify-between gap-6">
                <p className="font-mono text-[13px] font-semibold tracking-[0.28em] uppercase">
                  {data.titleLine || "Certificate of Completion"}
                </p>
                <div className="text-right font-mono text-[12px] leading-[1.7] text-[#4B5563]">
                  <p>No. {data.verificationCode}</p>
                  <p>Issued {formatIssued(data.issuedAt)}</p>
                </div>
              </div>

              <p className="mt-[78px] font-mono text-[12px] tracking-[0.22em] text-[#4B5563] uppercase">
                {data.subtitleLine || "This certifies that"}
              </p>
              <div className="mt-1 self-start">
                <p className={cn(nameFont.className, "max-w-[720px] truncate pr-3 text-[64px] leading-[1.1] text-[#0E1116]")}>
                  {data.studentName}
                </p>
                <svg viewBox="0 0 400 12" preserveAspectRatio="none" className="-mt-1 h-[10px] w-full" aria-hidden>
                  <path d="M2 8 Q 100 2 200 7 T 398 5" fill="none" stroke={BRAND.blue} strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              <p className="mt-[22px] text-[17px] text-[#4B5563]">has successfully completed the course</p>
              <p className="mt-1 max-w-[720px] truncate text-[36px] leading-tight font-bold tracking-[-0.02em]">{data.courseName}</p>
              {facts && <p className="mt-2 font-mono text-[12px] text-[#4B5563]">{facts}</p>}

              <div className="mt-auto flex items-end justify-between">
                <Signature name={data.directorName} title={data.directorTitle || "Director, TechOn Skills"} imageUrl={getImageSrc("signatures/ceo.png")} />
                <Seal />
                <Signature name={data.mentorName} title={data.mentorTitle || "Lead Mentor"} />
              </div>

              <div className="mt-[22px] flex items-center justify-between border-t border-[#E5E7EB] pt-[12px] font-mono text-[11px] text-[#4B5563]">
                <p>VERIFY: {shownUrl}</p>
                {showQr ? (
                  <div className="flex items-center gap-3">
                    <span className="tracking-[0.12em]">SCAN TO VERIFY</span>
                    <QrCode value={verifyUrl} size={64} label="" className="bg-white" />
                  </div>
                ) : (
                  <span>{data.footerLine || "TechOn Skills"}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {pendingBadge && isPending && (
        <div className="absolute top-3 right-3 z-10 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-black">Pending approval</div>
      )}
    </div>
  )
}

export type CertificateTemplateFields = {
  titleLine?: string
  subtitleLine?: string
  footerLine?: string
  directorName?: string
  directorTitle?: string
  mentorName?: string
  mentorTitle?: string
}

/** A certificate as the API returns it. */
export type CertificateApiFields = {
  studentName: string
  courseName: string
  percentage: number
  grade: string
  message?: string
  verificationCode: string
  status?: string
  issuedAt?: string | null
  template?: CertificateTemplateFields | null
  details?: CertificateViewData["details"]
}

export function toCertificateViewData(c: CertificateApiFields): CertificateViewData {
  return {
    studentName: c.studentName,
    courseName: c.courseName,
    percentage: c.percentage,
    grade: c.grade,
    message: c.message,
    verificationCode: c.verificationCode,
    status: c.status,
    issuedAt: c.issuedAt,
    details: c.details ?? null,
    ...(c.template ?? {}),
  }
}
