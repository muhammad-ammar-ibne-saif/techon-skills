import { SITE, absoluteUrl, snippet } from "./site"
import type { SeoArticle, SeoCompany, SeoCourse, SeoJob, SeoNews, SeoPortfolio } from "./server-api"

type Thing = Record<string, unknown>

/**
 * Structured data (schema.org JSON-LD). Search engines use it for rich results, and AI answer
 * engines use it to quote facts (fees, duration, address) correctly.
 */
export function JsonLd({ data }: { data: Thing | Thing[] }) {
  const graph = Array.isArray(data) ? { "@context": "https://schema.org", "@graph": data } : { "@context": "https://schema.org", ...data }
  // "<" is escaped so text from the database can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />
}

const ORG_ID = `${SITE.url}/#organization`
const SITE_ID = `${SITE.url}/#website`

export const orgRef = { "@id": ORG_ID }

const postalAddress = { "@type": "PostalAddress", ...SITE.address }

/** The institute itself: an educational organisation with a real office. */
export function organizationLd(): Thing {
  return {
    "@type": ["EducationalOrganization", "LocalBusiness"],
    "@id": ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: SITE.shortName,
    slogan: SITE.tagline,
    description: SITE.description,
    url: SITE.url,
    logo: { "@type": "ImageObject", url: absoluteUrl(SITE.logoPath), width: 512, height: 512 },
    image: absoluteUrl("/opengraph-image"),
    email: SITE.email,
    telephone: SITE.phoneE164,
    address: postalAddress,
    areaServed: [{ "@type": "Country", name: "Pakistan" }, { "@type": "City", name: "Lahore" }],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "admissions",
        telephone: SITE.phoneE164,
        email: SITE.email,
        areaServed: "PK",
        availableLanguage: ["English", "Urdu"],
      },
    ],
    knowsAbout: ["AI-powered learning", "Web development", "Mobile app development", "Software engineering", "E-commerce", "Shopify", "WordPress", "React", "Node.js"],
  }
}

export function websiteLd(): Thing {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.shortDescription,
    inLanguage: SITE.language,
    publisher: orgRef,
  }
}

export function breadcrumbLd(items: { name: string; path: string }[]): Thing {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  }
}

export function faqLd(items: { question: string; answer: string }[]): Thing {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  }
}

export const coursePath = (slug: string) => `/courses/${slug}`

export function courseDescription(c: SeoCourse) {
  return snippet(c.heroDescription || c.subtitle || c.subDescription, 300)
}

/** A course with its price, length and how it's taught. */
export function courseLd(c: SeoCourse): Thing {
  const url = absoluteUrl(coursePath(c.slug))
  const months = c.courseDurationInMonths
  return {
    "@type": "Course",
    "@id": `${url}#course`,
    name: c.title,
    description: courseDescription(c),
    url,
    provider: orgRef,
    inLanguage: SITE.language,
    educationalLevel: "Beginner to intermediate",
    teaches: c.technologies.map((t) => t.label).filter(Boolean),
    timeRequired: `P${months}M`,
    educationalCredentialAwarded: "Verifiable certificate of completion",
    offers: {
      "@type": "Offer",
      category: c.isFree ? "Free" : "Paid",
      price: c.isFree ? 0 : c.totalFee,
      priceCurrency: c.currency || "PKR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/enrollment"),
      description: c.isFree
        ? "Free"
        : `${c.currency || "PKR"} ${c.feePerMonth.toLocaleString("en-US")} per month for ${months} months (${c.totalNumberOfInstallments} instalments).`,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "Live classes on Google Meet with recordings, assignments and graded projects",
      courseSchedule: { "@type": "Schedule", duration: `P${months}M`, repeatFrequency: "P1W" },
      location: { "@type": "VirtualLocation", url },
    },
  }
}

/** Plain-language questions about one course, answered from its own data. */
export function courseFaqs(c: SeoCourse): { question: string; answer: string }[] {
  const cur = c.currency || "PKR"
  const skills = c.technologies.map((t) => t.label).filter(Boolean)
  return [
    {
      question: `How much does the ${c.title} course cost at TechOn Skills?`,
      answer: c.isFree
        ? `The ${c.title} course is free.`
        : `${cur} ${c.feePerMonth.toLocaleString("en-US")} per month, ${cur} ${c.totalFee.toLocaleString("en-US")} in total, paid in ${c.totalNumberOfInstallments} monthly instalments.`,
    },
    {
      question: `How long is the ${c.title} course?`,
      answer: `${c.courseDurationInMonths} months of live online classes on Google Meet, with recordings, assignments and graded projects on your student dashboard.`,
    },
    ...(skills.length
      ? [{ question: `What will I learn in ${c.title}?`, answer: `You build real projects with ${skills.join(", ")}. ${courseDescription(c)}` }]
      : []),
    {
      question: `Do I get a certificate for ${c.title}?`,
      answer: "Yes. Students who complete the course receive a certificate with a QR code that anyone, including employers, can verify online.",
    },
  ]
}

export function courseListLd(courses: SeoCourse[]): Thing {
  return {
    "@type": "ItemList",
    name: `${SITE.name} courses`,
    itemListElement: courses.map((c, i) => ({ "@type": "ListItem", position: i + 1, item: courseLd(c) })),
  }
}

const EMPLOYMENT_TYPE: Record<SeoJob["jobType"], string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  INTERNSHIP: "INTERN",
  CONTRACT: "CONTRACTOR",
}

/** Google for Jobs: only for open jobs posted on our board, never for imported ones. */
export function jobPostingLd(j: SeoJob): Thing | null {
  if (j.status !== "OPEN" || j.source === "FEED") return null
  const url = absoluteUrl(`/jobs/${j.id}`)
  const remote = j.workMode === "REMOTE"
  const [city] = (j.location || "Lahore").split(",").map((s) => s.trim())
  const salary =
    j.salaryMin != null || j.salaryMax != null
      ? {
          "@type": "MonetaryAmount",
          currency: j.salaryCurrency || "PKR",
          value: {
            "@type": "QuantitativeValue",
            unitText: "MONTH",
            ...(j.salaryMin != null ? { minValue: j.salaryMin } : {}),
            ...(j.salaryMax != null ? { maxValue: j.salaryMax } : {}),
          },
        }
      : undefined
  return {
    "@type": "JobPosting",
    title: j.title,
    description: j.description.replace(/\n/g, "<br>"),
    url,
    datePosted: j.postedAt,
    ...(j.deadline ? { validThrough: `${j.deadline}T23:59:59+05:00` } : {}),
    employmentType: EMPLOYMENT_TYPE[j.jobType],
    hiringOrganization: {
      "@type": "Organization",
      name: j.company?.name || j.companyName,
      ...(j.company?.website ? { sameAs: j.company.website } : {}),
      ...(j.companyLogo ? { logo: j.companyLogo } : {}),
    },
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "Pakistan" } }
      : {
          jobLocation: {
            "@type": "Place",
            address: { "@type": "PostalAddress", addressLocality: city || "Lahore", addressCountry: "PK" },
          },
        }),
    ...(salary ? { baseSalary: salary } : {}),
    ...(j.skills.length ? { skills: j.skills.join(", ") } : {}),
    ...(j.experience ? { experienceRequirements: j.experience } : {}),
    directApply: j.applyMode !== "EXTERNAL",
    identifier: { "@type": "PropertyValue", name: SITE.name, value: j.id },
  }
}

export function companyLd(c: SeoCompany): Thing {
  const sameAs = [c.website, c.linkedin, c.facebook, c.instagram, c.twitter].filter((u) => /^https?:\/\//.test(u))
  return {
    "@type": "Organization",
    name: c.name,
    url: absoluteUrl(`/companies/${c.slug}`),
    ...(c.logo ? { logo: c.logo } : {}),
    ...(c.about ? { description: snippet(c.about, 300) } : {}),
    ...(c.city ? { address: { "@type": "PostalAddress", addressLocality: c.city, addressCountry: "PK" } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export function profileLd(p: SeoPortfolio): Thing {
  const url = absoluteUrl(`/p/${p.slug}`)
  const sameAs = [p.github, p.linkedin, p.website].filter((u) => /^https?:\/\//.test(u))
  return {
    "@type": "ProfilePage",
    url,
    dateModified: p.updatedAt,
    mainEntity: {
      "@type": "Person",
      name: p.fullName,
      url,
      ...(p.headline ? { jobTitle: p.headline } : {}),
      ...(p.bio ? { description: snippet(p.bio, 300) } : {}),
      ...(p.profilePicture ? { image: p.profilePicture } : {}),
      ...(p.location ? { homeLocation: { "@type": "Place", name: p.location } } : {}),
      ...(p.skills.length ? { knowsAbout: p.skills } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      alumniOf: orgRef,
    },
  }
}

export function articleLd(a: SeoArticle): Thing {
  const url = absoluteUrl(`/articles/${a.slug}`)
  return {
    "@type": "Article",
    headline: a.metaTitle || a.title,
    description: snippet(a.metaDescription || a.excerpt, 300),
    url,
    mainEntityOfPage: url,
    ...(a.coverImage ? { image: a.coverImage } : {}),
    ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
    dateModified: a.updatedAt || a.publishedAt,
    author: a.authorName ? { "@type": "Person", name: a.authorName } : orgRef,
    publisher: orgRef,
    inLanguage: SITE.language,
  }
}

export function newsLd(n: SeoNews): Thing {
  const url = absoluteUrl(`/news/${n.id}`)
  return {
    "@type": "NewsArticle",
    headline: n.title,
    description: snippet(n.description, 300),
    url,
    mainEntityOfPage: url,
    datePublished: n.createdAt,
    dateModified: n.updatedAt,
    author: orgRef,
    publisher: orgRef,
    image: absoluteUrl("/opengraph-image"),
  }
}
