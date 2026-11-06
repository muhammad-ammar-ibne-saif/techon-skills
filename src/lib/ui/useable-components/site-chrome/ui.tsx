import type { ReactNode } from "react"

import { cn } from "@/lib/helpers"

/** Shared look of the public site (home, courses, articles, contact...). Accent: `--site-accent` in globals.css. */

export const SITE_EMAIL = "info@techonskills.com"
export const SITE_ADDRESS =
  "8th Floor, Office No. 812, Al Hafeez Executive Towers, Gulberg II, Firdous Market, Lahore, Punjab, Pakistan"

export const siteContainer = "mx-auto w-full max-w-[70rem] px-4 sm:px-6 lg:px-8"

export const siteButton = {
  primary:
    "inline-flex items-center justify-center gap-1.5 rounded-md bg-(--site-accent) px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-[transform,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-(--site-accent)/25 active:translate-y-0 active:scale-[0.98] disabled:opacity-50",
  outline:
    "inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-muted/50 active:translate-y-0 active:scale-[0.98]",
  dark: "inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3.5 py-2 text-sm font-medium text-background transition-[transform,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.98]",
} as const

/** Dotted background used behind page heroes. */
export const siteDotGrid =
  "bg-[radial-gradient(circle,color-mix(in_oklab,var(--foreground)_14%,transparent)_1px,transparent_1.2px)] bg-size-[18px_18px]"

/** Small monospace label above a section, e.g. "// 001 what you build". */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("font-mono text-[11px] tracking-wide text-(--site-accent)", className)}>{children}</div>
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-[2.6rem] sm:leading-[1.1]", className)}>
      {children}
    </h2>
  )
}

/** Top of an inner page: dotted band with label, big title, intro text and optional actions. */
export function PageIntro({
  label,
  title,
  description,
  children,
}: {
  label: string
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className={cn("border-border/60 border-b", siteDotGrid)}>
      <div className={cn(siteContainer, "site-intro py-14 sm:py-20")}>
        <SectionLabel>{label}</SectionLabel>
        <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.25rem]">
          {title}
        </h1>
        {description && <p className="text-muted-foreground mt-5 max-w-xl text-[15px] leading-relaxed">{description}</p>}
        {children && <div className="mt-7 flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </section>
  )
}

/** Small green pill for free courses. */
export function FreeTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-medium tracking-normal text-emerald-700 dark:text-emerald-400",
        className
      )}
    >
      {children}
    </span>
  )
}
