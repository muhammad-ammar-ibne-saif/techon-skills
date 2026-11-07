import { ImageResponse } from "next/og"

import { SITE } from "./site"

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

const BLUE = "#3B3BF5"
const ORANGE = "#FFB020"
const INK = "#0E1116"

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 264 264">
      <rect width="264" height="264" rx="72" fill={BLUE} />
      <rect x="119" y="120" width="26" height="102" rx="13" fill={ORANGE} />
      <path d="M25 93 132 42 239 93 132 140Z" fill="#FFFFFF" />
      <rect x="209" y="94" width="10" height="64" fill="#FFFFFF" />
      <circle cx="214" cy="165" r="13" fill={ORANGE} />
    </svg>
  )
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/**
 * The 1200×630 card used when a page is shared (WhatsApp, LinkedIn, Facebook, X) and as the
 * image search engines show. Dark brand background, logo, a label, a big title and one line.
 */
export function brandCard({ eyebrow, title, subtitle, chips = [] }: { eyebrow: string; title: string; subtitle?: string; chips?: string[] }) {
  const t = clip(title, 70)
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: INK,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Mark size={84} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>TechOn</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
              <div style={{ fontSize: 17, letterSpacing: 8, color: "#9F9FFA", fontWeight: 700 }}>SKILLS</div>
              <div style={{ width: 120, height: 2, background: "rgba(255,255,255,0.8)" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 5, color: ORANGE, fontWeight: 700, textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontSize: t.length > 42 ? 58 : 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, marginTop: 14, maxWidth: 1040 }}>{t}</div>
          {subtitle && <div style={{ fontSize: 28, color: "rgba(255,255,255,0.72)", marginTop: 20, maxWidth: 1000 }}>{clip(subtitle, 110)}</div>}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {chips.slice(0, 4).map((c) => (
              <div key={c} style={{ display: "flex", fontSize: 21, padding: "8px 18px", borderRadius: 999, background: "rgba(59,59,245,0.35)", border: "1px solid rgba(159,159,250,0.5)" }}>
                {clip(c, 28)}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>{SITE.url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    OG_SIZE
  )
}
