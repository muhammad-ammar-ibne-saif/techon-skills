import type { MetadataRoute } from "next"

import { getSeoArticles, getSeoCourses, getSeoJobs, getSeoNewsList } from "@/lib/seo/server-api"
import { absoluteUrl } from "@/lib/seo/site"

/** Rebuilt at most every hour, so new courses, articles and jobs appear without a deploy. */
export const revalidate = 3600

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/courses", priority: 0.9, changeFrequency: "weekly" },
  { path: "/enrollment", priority: 0.8, changeFrequency: "monthly" },
  { path: "/jobs", priority: 0.8, changeFrequency: "daily" },
  { path: "/hire", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faqs", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/articles", priority: 0.7, changeFrequency: "weekly" },
  { path: "/news", priority: 0.5, changeFrequency: "weekly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms-of-service", priority: 0.2, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, articles, news, jobs] = await Promise.all([getSeoCourses(), getSeoArticles(), getSeoNewsList(), getSeoJobs()])
  const companies = [...new Set(jobs.map((j) => j.company?.slug).filter((s): s is string => !!s))]

  return [
    ...STATIC_PAGES.map((p) => ({ url: absoluteUrl(p.path), changeFrequency: p.changeFrequency, priority: p.priority })),
    ...courses.map((c) => ({
      url: absoluteUrl(`/courses/${c.slug}`),
      lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...articles.map((a) => ({
      url: absoluteUrl(`/articles/${a.slug}`),
      lastModified: new Date(a.updatedAt || a.publishedAt || Date.now()),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      ...(a.coverImage ? { images: [a.coverImage] } : {}),
    })),
    ...news.map((n) => ({ url: absoluteUrl(`/news/${n.id}`), lastModified: new Date(n.updatedAt), changeFrequency: "yearly" as const, priority: 0.4 })),
    ...jobs.map((j) => ({ url: absoluteUrl(`/jobs/${j.id}`), lastModified: new Date(j.postedAt), changeFrequency: "daily" as const, priority: 0.6 })),
    ...companies.map((slug) => ({ url: absoluteUrl(`/companies/${slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
  ]
}
