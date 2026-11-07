import { COURSES } from "@/lib/data/public-courses"

const GRAPHQL_URL = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || "http://localhost:8080/graphql-techonskills"

/**
 * Public data for metadata, structured data and the sitemap, fetched on the server and cached.
 * Never throws: on any failure it returns null so a page still renders with fallbacks.
 */
export async function serverGql<T>(query: string, variables: Record<string, unknown> = {}, revalidate = 600): Promise<T | null> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: T; errors?: unknown[] }
    return json.data ?? null
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ courses */

export type SeoCourse = {
  id?: string
  slug: string
  title: string
  subtitle: string
  heroDescription: string
  subDescription: string
  courseDurationInMonths: number
  feePerMonth: number
  totalFee: number
  totalNumberOfInstallments: number
  currency: string
  isFree?: boolean
  technologies: { label: string }[]
  updatedAt?: string
}

const COURSE_FIELDS = `id slug title subtitle heroDescription subDescription courseDurationInMonths feePerMonth totalFee totalNumberOfInstallments currency isFree technologies { label } updatedAt`

const fallbackCourses = (): SeoCourse[] =>
  COURSES.map((c) => ({
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle ?? "",
    heroDescription: c.heroDescription ?? "",
    subDescription: c.subDescription ?? "",
    courseDurationInMonths: c.courseDurationInMonths,
    feePerMonth: c.feePerMonth,
    totalFee: c.totalFee,
    totalNumberOfInstallments: c.totalNumberOfInstallments,
    currency: c.currency ?? "PKR",
    technologies: (c.technologiesSection?.technologies ?? []).map((t) => ({ label: t.label })),
  }))

export async function getSeoCourses(): Promise<SeoCourse[]> {
  const data = await serverGql<{ getCourses: SeoCourse[] }>(`query SeoCourses { getCourses { ${COURSE_FIELDS} } }`)
  return data?.getCourses?.length ? data.getCourses : fallbackCourses()
}

export async function getSeoCourse(slug: string): Promise<SeoCourse | null> {
  const data = await serverGql<{ getCourseBySlug: SeoCourse | null }>(
    `query SeoCourse($slug: String!) { getCourseBySlug(slug: $slug) { ${COURSE_FIELDS} } }`,
    { slug }
  )
  return data?.getCourseBySlug ?? fallbackCourses().find((c) => c.slug === slug) ?? null
}

/* ------------------------------------------------------------------ jobs and companies */

export type SeoJob = {
  id: string
  source: string
  title: string
  description: string
  companyName: string
  companyLogo: string
  location: string
  workMode: "ONSITE" | "REMOTE" | "HYBRID"
  jobType: "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT"
  experience: string
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  skills: string[]
  applyMode: string
  status: string
  deadline: string | null
  postedAt: string
  company: { slug: string; website: string; logo: string; name: string } | null
}

const JOB_FIELDS = `id source title description companyName companyLogo location workMode jobType experience salaryMin salaryMax salaryCurrency skills applyMode status deadline postedAt company { slug website logo name }`

export async function getSeoJob(id: string): Promise<SeoJob | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null
  const data = await serverGql<{ job: SeoJob | null }>(`query SeoJob($id: ID!) { job(id: $id) { ${JOB_FIELDS} } }`, { id }, 300)
  return data?.job ?? null
}

/** Open jobs listed on our board (not imported feed jobs, which point elsewhere). */
export async function getSeoJobs(limit = 200): Promise<SeoJob[]> {
  const data = await serverGql<{ jobs: { items: SeoJob[] } }>(
    `query SeoJobs($limit: Int) { jobs(filter: { portalOnly: true }, page: 1, limit: $limit) { items { ${JOB_FIELDS} } } }`,
    { limit },
    900
  )
  return (data?.jobs.items ?? []).filter((j) => j.source !== "FEED")
}

export type SeoCompany = {
  name: string
  slug: string
  logo: string
  website: string
  about: string
  industry: string
  size: string
  city: string
  openJobsCount: number
  linkedin: string
  facebook: string
  instagram: string
  twitter: string
}

export async function getSeoCompany(slug: string): Promise<SeoCompany | null> {
  const data = await serverGql<{ companyBySlug: SeoCompany | null }>(
    `query SeoCompany($slug: String!) { companyBySlug(slug: $slug) { name slug logo website about industry size city openJobsCount linkedin facebook instagram twitter } }`,
    { slug }
  )
  return data?.companyBySlug ?? null
}

/* ------------------------------------------------------------------ portfolios */

export type SeoPortfolio = {
  slug: string
  fullName: string
  profilePicture: string
  headline: string
  bio: string
  location: string
  skills: string[]
  github: string
  linkedin: string
  website: string
  openToWork: boolean
  courses: string[]
  updatedAt: string
}

export async function getSeoPortfolio(slug: string): Promise<SeoPortfolio | null> {
  const data = await serverGql<{ portfolio: SeoPortfolio | null }>(
    `query SeoPortfolio($slug: String!) { portfolio(slug: $slug) { slug fullName profilePicture headline bio location skills github linkedin website openToWork courses updatedAt } }`,
    { slug },
    300
  )
  return data?.portfolio ?? null
}

/* ------------------------------------------------------------------ articles and news */

export type SeoArticle = {
  slug: string
  title: string
  excerpt: string
  coverImage: string
  authorName: string
  publishedAt: string | null
  updatedAt: string
  metaTitle: string
  metaDescription: string
}

export async function getSeoArticles(): Promise<SeoArticle[]> {
  const data = await serverGql<{ getArticles: SeoArticle[] }>(
    `query SeoArticles { getArticles(publishedOnly: true) { slug title excerpt coverImage authorName publishedAt updatedAt metaTitle metaDescription } }`
  )
  return data?.getArticles ?? []
}

export type SeoNews = { id: string; title: string; description: string; createdAt: string; updatedAt: string }

export async function getSeoNewsList(): Promise<SeoNews[]> {
  const data = await serverGql<{ getNewsPosts: SeoNews[] }>(`query SeoNewsList { getNewsPosts { id title description createdAt updatedAt } }`)
  return data?.getNewsPosts ?? []
}

export async function getSeoNews(id: string): Promise<SeoNews | null> {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null
  const data = await serverGql<{ getNewsPost: SeoNews | null }>(
    `query SeoNews($id: ID!) { getNewsPost(id: $id) { id title description createdAt updatedAt } }`,
    { id }
  )
  return data?.getNewsPost ?? null
}

export async function getSeoArticle(slug: string): Promise<SeoArticle | null> {
  const data = await serverGql<{ getArticleBySlug: SeoArticle | null }>(
    `query SeoArticle($slug: String!) { getArticleBySlug(slug: $slug) { slug title excerpt coverImage authorName publishedAt updatedAt metaTitle metaDescription } }`,
    { slug },
    60
  )
  return data?.getArticleBySlug ?? null
}
