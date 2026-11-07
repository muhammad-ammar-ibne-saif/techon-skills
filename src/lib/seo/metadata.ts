import type { Metadata } from "next"

import { SITE, absoluteUrl } from "./site"

type PageMeta = {
  /** Shown as "Title | TechOn Skills" (the root layout adds the suffix). */
  title: string
  description: string
  /** Path on this site, e.g. "/courses". Used for the canonical link and og:url. */
  path: string
  /**
   * Absolute image URL. Leave out for the site's branded share image. Pass "route" when the
   * route has its own opengraph-image file, so Next links that generated image instead.
   */
  image?: string | null | "route"
  type?: "website" | "article" | "profile"
  /** For articles. */
  publishedTime?: string | null
  modifiedTime?: string | null
  authors?: string[]
  keywords?: string[]
  /** Keep the page out of search results (it still passes link value). */
  noindex?: boolean
}

/** The branded 1200×630 card from app/opengraph-image.tsx. */
export const DEFAULT_SHARE_IMAGE = absoluteUrl("/opengraph-image")

/** Title, description, canonical link and social cards for one page, the same way everywhere. */
export function pageMetadata(m: PageMeta): Metadata {
  const url = absoluteUrl(m.path)
  const fromRoute = m.image === "route"
  const images = fromRoute ? undefined : [{ url: m.image || DEFAULT_SHARE_IMAGE, width: 1200, height: 630, alt: m.title }]
  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: m.title,
      description: m.description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      type: m.type ?? "website",
      ...(images ? { images } : {}),
      ...(m.type === "article"
        ? { publishedTime: m.publishedTime ?? undefined, modifiedTime: m.modifiedTime ?? undefined, authors: m.authors }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: m.title,
      description: m.description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    ...(m.noindex ? { robots: { index: false, follow: true } } : {}),
  }
}

export const NOINDEX: Metadata = { robots: { index: false, follow: false, nocache: true } }
