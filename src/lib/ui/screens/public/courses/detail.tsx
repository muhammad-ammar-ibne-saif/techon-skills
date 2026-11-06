"use client"

import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@apollo/client/react"
import { useMemo } from "react"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react"

import { useCourses } from "@/lib/providers/courses"
import { useUser } from "@/lib/providers/user"
import {
  cn,
  formatCourseDuration,
  formatCoursePrice,
  getImageSrc,
  isBackendImageUrl,
  mapApiCourseToICourse,
  type IApiCourse,
} from "@/lib/helpers"
import { GET_COURSE_BY_SLUG } from "@/lib/graphql"
import { formatStartDate, seatsText, useOpenBatches } from "@/lib/ui/screens/public/enrollment/enrollment-extras"

/** Open batches of the course with start dates and seats, linking to the enrollment form. */
function UpcomingBatches({ slug, title, enrollHref }: { slug: string; title: string; enrollHref: string }) {
  const courses = useMemo(() => [{ slug, title }], [slug, title])
  const list = useOpenBatches(courses).batches[slug] ?? []
  if (!list.length) return null
  return (
    <div className="border-border border-t px-5 py-4">
      <div className="text-muted-foreground font-mono text-[10px]">upcoming batches</div>
      <ul className="mt-2 space-y-2 text-sm">
        {list.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3">
            <span>
              <span className="font-medium">{b.name}</span>
              {formatStartDate(b.startDate) && <span className="text-muted-foreground"> · starts {formatStartDate(b.startDate)}</span>}
            </span>
            <Link
              href={enrollHref}
              className={cn("shrink-0 text-xs font-medium", b.isFull ? "text-destructive" : "text-(--site-accent) hover:underline")}
            >
              {b.isFull ? "Full · join waitlist" : seatsText(b)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
import { StepLoop } from "@/lib/ui/screens/public/landing"
import {
  PageIntro,
  SectionLabel,
  SectionTitle,
  siteButton,
  siteContainer,
  siteDotGrid,
} from "@/lib/ui/useable-components/site-chrome/ui"
import { COURSE_DETAIL } from "@/utils/constants/course-detail"
import { CONFIG } from "@/utils/constants/config"

export const PublicCourseDetailScreen = ({ slug }: { slug: string }) => {
  const { getCourseBySlug, loading: coursesLoading } = useCourses()
  const { enrolledCoursesFromApi, requestedCoursesFromApi } = useUser()
  const courseFromList = getCourseBySlug(slug)

  const enrolled = useMemo(
    () => new Set((enrolledCoursesFromApi ?? []).flatMap((c) => [c.id, c.slug]).filter(Boolean)),
    [enrolledCoursesFromApi]
  )
  const requested = useMemo(
    () => new Set((requestedCoursesFromApi ?? []).flatMap((c) => [c.id, c.slug]).filter(Boolean)),
    [requestedCoursesFromApi]
  )

  const { data: slugData, loading: slugLoading } = useQuery<{ getCourseBySlug: IApiCourse | null }>(GET_COURSE_BY_SLUG, {
    variables: { slug },
    skip: !slug || !!courseFromList,
  })

  const courseBySlug = slugData?.getCourseBySlug ? mapApiCourseToICourse(slugData.getCourseBySlug) : null
  const course = courseFromList ?? courseBySlug ?? null
  const loading = coursesLoading || (!!slug && !courseFromList && slugLoading)

  if (loading) {
    return (
      <div className={cn(siteContainer, "text-muted-foreground py-24 font-mono text-xs")}>loading course…</div>
    )
  }

  if (!course) {
    const { notFound } = COURSE_DETAIL
    return (
      <PageIntro label="// 404" title={notFound.title} description="This course may have been removed or the link is wrong.">
        <Link href={CONFIG.ROUTES.PUBLIC.COURSES} className={siteButton.primary}>
          {notFound.backLabel}
        </Link>
      </PageIntro>
    )
  }

  const { hero, articleSection, steps: stepsSection, infoCard, cta } = COURSE_DETAIL
  const status =
    (course.id && enrolled.has(course.id)) || enrolled.has(course.slug)
      ? "enrolled"
      : (course.id && requested.has(course.id)) || requested.has(course.slug)
        ? "requested"
        : null
  const enrollHref = `${CONFIG.ROUTES.PUBLIC.ENROLLMENT}?course=${encodeURIComponent(course.slug)}`
  const tools = course.technologiesSection.technologies

  const enrollAction = status ? (
      <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
        <CheckIcon className="size-3.5" aria-hidden />
        {status === "enrolled" ? "you're enrolled" : "enrollment requested"}
      </span>
    ) : (
      <Link href={enrollHref} className={siteButton.primary}>
        {hero.enrollLabel} <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
  )

  const sections = [
    course.heroDescription && "overview",
    course.articleFeatures.length > 0 && "what you get",
    tools.length > 0 && "tools",
    "your path",
  ].filter(Boolean)
  const nextLabel = (name: string) => `// ${String(sections.indexOf(name) + 1).padStart(3, "0")} ${name}`

  return (
    <div className="w-full">
      <section className={cn("border-border/60 border-b", siteDotGrid)}>
        <div className={cn(siteContainer, "grid items-start gap-10 py-14 sm:py-20 lg:grid-cols-[1.2fr_0.8fr]")}>
          <div>
            <Link
              href={CONFIG.ROUTES.PUBLIC.COURSES}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-[11px]"
            >
              <ArrowLeftIcon className="size-3" aria-hidden /> {hero.backToCoursesLabel.toLowerCase()}
            </Link>
            <SectionLabel className="mt-6">
              {`// ${formatCourseDuration(course).toLowerCase()}`}
            </SectionLabel>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.25rem]">
              {course.title}
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-[15px] leading-relaxed">{course.subtitle}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {enrollAction}
              <a href="#path" className={siteButton.outline}>
                How it works
              </a>
            </div>
            <p className="text-muted-foreground mt-6 max-w-xl text-xs leading-relaxed">{hero.careerNote}</p>
          </div>

          <div className="border-border bg-card rounded-xl border shadow-[0_24px_60px_-28px_rgba(15,15,40,0.35)]">
            <div className="border-border border-b px-5 py-3 font-mono text-[10px] text-muted-foreground">
              {hero.cardTitle.toLowerCase()}
            </div>
            <ul className="divide-border divide-y text-sm">
              {hero.bullets.map((t) => (
                <li key={t} className="flex items-start gap-2.5 px-5 py-3">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-(--site-accent)" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <dl className="border-border grid grid-cols-2 border-t">
              <div className="px-5 py-4">
                <dt className="text-muted-foreground font-mono text-[10px]">duration</dt>
                <dd className="mt-1 text-lg font-semibold">{formatCourseDuration(course)}</dd>
              </div>
              <div className="border-border border-l px-5 py-4">
                <dt className="text-muted-foreground font-mono text-[10px]">full fee</dt>
                <dd className="mt-1 text-lg font-semibold">{formatCoursePrice(course)}</dd>
              </div>
            </dl>
            <UpcomingBatches slug={course.slug} title={course.title} enrollHref={enrollHref} />
          </div>
        </div>
      </section>

      {course.heroDescription && (
        <section className="py-16 sm:py-20">
          <div className={siteContainer}>
            <SectionLabel>{nextLabel("overview")}</SectionLabel>
            <p className="mt-4 max-w-3xl text-xl leading-relaxed tracking-tight sm:text-2xl">{course.heroDescription}</p>
          </div>
        </section>
      )}

      {course.articleFeatures.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className={siteContainer}>
            <SectionLabel>{nextLabel("what you get")}</SectionLabel>
            <SectionTitle>{articleSection.heading}</SectionTitle>
            <div className="mt-12 space-y-14">
              {course.articleFeatures.map((feature, idx) => (
                <div key={feature.name} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                  <div className={cn("border-border bg-muted/40 overflow-hidden rounded-lg border", idx % 2 === 1 && "lg:order-2")}>
                    <Image
                      src={getImageSrc(feature.image) || feature.image}
                      alt=""
                      width={800}
                      height={600}
                      className="aspect-4/3 h-full w-full object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      unoptimized={isBackendImageUrl(feature.image)}
                    />
                  </div>
                  <div>
                    <div className="text-muted-foreground font-mono text-[10px]">{String(idx + 1).padStart(2, "0")}</div>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">{feature.name}</h3>
                    <p className="text-muted-foreground mt-3 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tools.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className={siteContainer}>
            <SectionLabel>{nextLabel("tools")}</SectionLabel>
            <SectionTitle>{course.technologiesSection.title}</SectionTitle>
            <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
              {course.technologiesSection.description}
            </p>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tools.map((t) => (
                <li key={t.label} className="border-border bg-card flex items-start gap-3 rounded-lg border p-4">
                  {t.logo ? (
                    <Image
                      src={getImageSrc(t.logo) || t.logo}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 shrink-0 rounded object-contain"
                      unoptimized={isBackendImageUrl(t.logo)}
                    />
                  ) : (
                    <span className="bg-muted size-9 shrink-0 rounded" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{t.label}</div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-3 text-xs leading-relaxed">{t.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="path" className="scroll-mt-20 py-16 sm:py-20">
        <div className={siteContainer}>
          <SectionLabel>{nextLabel("your path")}</SectionLabel>
          <SectionTitle>{stepsSection.heading}</SectionTitle>
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">{stepsSection.subtext}</p>
          <div className="mt-12">
            <StepLoop steps={stepsSection.items.map((s) => ({ t: s.title.replace(/^Step \d+:\s*/, ""), d: s.description }))} />
          </div>
          <dl className="border-border mt-14 grid overflow-hidden rounded-lg border sm:grid-cols-3">
            {infoCard.items.map((item, i) => (
              <div key={item.key} className={cn("border-border px-5 py-5", i > 0 && "border-t sm:border-t-0 sm:border-l")}>
                <dt className="text-muted-foreground font-mono text-[10px]">{item.label.toLowerCase()}</dt>
                <dd className="mt-1.5 font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-border/60 border-t py-14">
        <div className={cn(siteContainer, "flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between")}>
          <div>
            <div className="text-2xl font-semibold tracking-tight">{cta.heading}</div>
            <div className="text-muted-foreground mt-1 text-sm">
              Course fee: {formatCoursePrice(course)}
            </div>
          </div>
          {enrollAction}
        </div>
      </section>
    </div>
  )
}
