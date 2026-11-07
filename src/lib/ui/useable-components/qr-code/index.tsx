"use client"

import { useMemo } from "react"
import QRCode from "qrcode"

/** A QR code drawn as SVG in the browser, so the link is never sent to another service. */
export function QrCode({ value, size = 88, className, label }: { value: string; size?: number; className?: string; label?: string }) {
  const { path, count } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" })
    const n = qr.modules.size
    let d = ""
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`
    return { path: d, count: n }
  }, [value])
  return (
    <svg
      viewBox={`-2 -2 ${count + 4} ${count + 4}`}
      width={size}
      height={size}
      role="img"
      aria-label={label ?? "QR code"}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect x={-2} y={-2} width={count + 4} height={count + 4} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  )
}
