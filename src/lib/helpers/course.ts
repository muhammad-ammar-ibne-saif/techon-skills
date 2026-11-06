import type { ICourse, ICourseTechnologiesSection } from "@/utils/interfaces"

/** Format course duration for display (e.g. "6 Months", "1 Year"). */
export function formatCourseDuration(course: ICourse): string {
  const n = course.courseDurationInMonths
  if (n >= 12) return n === 12 ? "1 Year" : `${n / 12} Year (${n} months)`
  return `${n} Months`
}

/** The tag of a free course ("Free", "Complimentary"...), or null for a paid course. */
export function courseFreeTag(course: Pick<ICourse, "isFree" | "freeLabel"> | null | undefined): string | null {
  return course?.isFree ? course.freeLabel?.trim() || "Free" : null
}

/** Format course price for display (e.g. "PKR 30,000"), or the free tag for a free course. */
export function formatCoursePrice(course: ICourse): string {
  const free = courseFreeTag(course)
  if (free) return free
  const { currency, totalFee } = course
  return `${currency} ${(totalFee ?? 0).toLocaleString()}`
}

/** API course shape (GraphQL) – technologies at top level, no modules. */
export interface IApiCourse {
  id?: string
  title: string
  slug: string
  heroDescription: string
  subtitle: string
  subDescription: string
  courseDurationInMonths: number
  feePerMonth: number
  totalFee: number
  totalNumberOfInstallments: number
  currency: string
  technologies: Array<{ label: string; description: string; logo: string }>
  articleFeatures: Array<{ name: string; description: string; image: string }>
  isFree?: boolean
  freeLabel?: string
}

/** Map API course to ICourse (adds technologiesSection, empty modules). */
export function mapApiCourseToICourse(
  api: IApiCourse,
  technologiesSectionFallback: ICourseTechnologiesSection = {
    title: "Tools you'll master (with real projects)",
    description: "You won't just “see” these technologies — you'll build with them, submit work, and track marks.",
    technologies: api.technologies ?? [],
  }
): ICourse {
  return {
    id: api.id,
    title: api.title,
    heroDescription: api.heroDescription,
    courseDurationInMonths: api.courseDurationInMonths,
    feePerMonth: api.feePerMonth,
    totalFee: api.totalFee,
    totalNumberOfInstallments: api.totalNumberOfInstallments,
    currency: api.currency,
    subtitle: api.subtitle,
    subDescription: api.subDescription,
    slug: api.slug,
    technologiesSection: {
      ...technologiesSectionFallback,
      technologies: api.technologies ?? technologiesSectionFallback.technologies,
    },
    modules: [],
    articleFeatures: api.articleFeatures ?? [],
    isFree: api.isFree ?? false,
    freeLabel: api.freeLabel ?? "",
  }
}
