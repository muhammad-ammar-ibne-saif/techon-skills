import { cn } from "@/lib/helpers"

/** Brand colours from the logo. */
export const BRAND = { blue: "#3B3BF5", orange: "#FFB020", ink: "#0E1116" } as const

/** The square app mark: graduation cap on a blue tile. */
export function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 264 264"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="264" height="264" rx="72" fill={BRAND.blue} />
      <rect x="119" y="120" width="26" height="102" rx="13" fill={BRAND.orange} />
      <path d="M25 93 132 42 239 93 132 140Z" fill="#FFFFFF" />
      <rect x="209" y="94" width="10" height="64" fill="#FFFFFF" />
      <circle cx="214" cy="165" r="13" fill={BRAND.orange} />
    </svg>
  )
}

/**
 * Mark plus "TechOn / SKILLS" wordmark. `tone` picks colours for a light or dark background;
 * "auto" follows the site theme.
 */
export function BrandLogo({
  className,
  markClassName,
  tone = "auto",
  tagline = false,
  compact = false,
}: {
  className?: string
  markClassName?: string
  tone?: "auto" | "light" | "dark"
  tagline?: boolean
  /** Smaller text for app bars. */
  compact?: boolean
}) {
  const word = tone === "dark" ? "text-white" : tone === "light" ? "text-[#0E1116]" : "text-[#0E1116] dark:text-white"
  const skills = tone === "dark" ? "text-[#9F9FFA]" : tone === "light" ? "text-[#3B3BF5]" : "text-[#3B3BF5] dark:text-[#9F9FFA]"
  const line = tone === "dark" ? "bg-white/80" : tone === "light" ? "bg-[#0E1116]" : "bg-[#0E1116] dark:bg-white/80"
  const tag = tone === "dark" ? "text-white/70" : tone === "light" ? "text-[#4B5563]" : "text-[#4B5563] dark:text-white/70"
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="TechOn Skills" role="img">
      <BrandMark className={cn(compact ? "size-8" : "size-10", markClassName)} />
      <span className="flex flex-col leading-none" aria-hidden>
        <span className={cn("font-sans font-extrabold tracking-[-0.04em]", compact ? "text-lg" : "text-[1.4rem]", word)}>TechOn</span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <span className={cn("font-sans font-semibold tracking-[0.42em]", compact ? "text-[8px]" : "text-[9px]", skills)}>SKILLS</span>
          <span className={cn("h-px flex-1", line)} />
        </span>
        {tagline && <span className={cn("mt-1 font-mono text-[8px] tracking-[0.18em]", tag)}>LEARN. BUILD. GROW.</span>}
      </span>
    </span>
  )
}
