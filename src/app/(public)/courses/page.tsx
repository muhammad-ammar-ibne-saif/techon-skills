import type { Metadata } from "next"

import { JsonLd, breadcrumbLd, courseListLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { getSeoCourses } from "@/lib/seo/server-api"
import { PublicCoursesScreen } from "@/lib/ui/screens/public/courses"

export const metadata: Metadata = pageMetadata({
  title: "Courses: Web Development, Mobile Apps, Software Engineering & E-commerce",
  description:
    "Compare TechOn Skills courses in web development, mobile app development, software engineering and e-commerce. Live online classes, real projects, certificates and career support.",
  path: "/courses",
})

export default async function CoursesPage() {
  const courses = await getSeoCourses()
  return (
    <>
      <JsonLd data={[courseListLd(courses), breadcrumbLd([{ name: "Courses", path: "/courses" }])]} />
      <PublicCoursesScreen />
    </>
  )
}
