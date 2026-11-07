import type { Metadata } from "next"

import { JsonLd, breadcrumbLd, courseDescription, courseFaqs, courseLd, coursePath, faqLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { getSeoCourse } from "@/lib/seo/server-api"
import { snippet } from "@/lib/seo/site"
import { PublicCourseDetailScreen } from "@/lib/ui/screens/public/courses/detail"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const c = await getSeoCourse(slug)
  if (!c) return { title: "Course", robots: { index: false, follow: true } }
  const cur = c.currency || "PKR"
  const fee = c.isFree ? "Free" : `${cur} ${c.feePerMonth.toLocaleString("en-US")}/month`
  return pageMetadata({
    title: `${c.title} Course in Lahore (${c.courseDurationInMonths} Months, ${fee})`,
    description: snippet(`${courseDescription(c)} ${c.courseDurationInMonths} months, live online, ${fee}. Certificate and career support included.`),
    path: coursePath(c.slug),
    image: "route",
    keywords: [c.title, `${c.title} course Lahore`, `${c.title} course Pakistan`, ...c.technologies.map((t) => t.label)],
  })
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params
  const c = await getSeoCourse(slug)
  return (
    <>
      {c && (
        <JsonLd
          data={[
            courseLd(c),
            faqLd(courseFaqs(c)),
            breadcrumbLd([
              { name: "Courses", path: "/courses" },
              { name: c.title, path: coursePath(c.slug) },
            ]),
          ]}
        />
      )}
      <PublicCourseDetailScreen slug={slug} />
    </>
  )
}
