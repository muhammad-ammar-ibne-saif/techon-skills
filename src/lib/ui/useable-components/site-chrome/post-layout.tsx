import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { cn } from "@/lib/helpers"
import { siteButton, siteContainer, siteDotGrid, SectionLabel } from "./ui"

/** Layout for a single article or news post: back link, mono meta line, title, intro, then the body. */
export function PostLayout({
  backHref,
  backLabel,
  meta,
  title,
  intro,
  children,
}: {
  backHref: string
  backLabel: string
  meta?: string
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <article className="w-full">
      <header className={cn("border-border/60 border-b", siteDotGrid)}>
        <div className={cn(siteContainer, "max-w-3xl! py-12 sm:py-16")}>
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-[11px]"
          >
            <ArrowLeftIcon className="size-3" aria-hidden /> {backLabel}
          </Link>
          {meta && <SectionLabel className="mt-8">{`// ${meta}`}</SectionLabel>}
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">{title}</h1>
          {intro && <p className="text-muted-foreground mt-5 text-lg leading-relaxed">{intro}</p>}
        </div>
      </header>
      <div className={cn(siteContainer, "max-w-3xl! py-12 sm:py-16")}>{children}</div>
    </article>
  )
}

/** Shown when a post can't be found. */
export function PostNotFound({ title, text, backHref, backLabel }: { title: string; text: string; backHref: string; backLabel: string }) {
  return (
    <section className={cn("border-border/60 border-b", siteDotGrid)}>
      <div className={cn(siteContainer, "py-20")}>
        <SectionLabel>{"// 404"}</SectionLabel>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em]">{title}</h1>
        <p className="text-muted-foreground mt-4 max-w-md text-sm">{text}</p>
        <Link href={backHref} className={cn(siteButton.primary, "mt-7")}>
          {backLabel}
        </Link>
      </div>
    </section>
  )
}

/** Typography for rich text from the CMS (articles). */
export const postProse =
  "prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-7 prose-a:text-(--site-accent) prose-img:rounded-lg prose-img:border prose-img:border-border"
