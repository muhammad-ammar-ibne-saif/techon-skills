"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRightIcon, CheckIcon, SearchIcon } from "lucide-react"

import { useCourses } from "@/lib/providers/courses"
import { useUser } from "@/lib/providers/user"
import { cn, courseFreeTag, formatCourseDuration, formatCoursePrice } from "@/lib/helpers"
import { FreeTag, PageIntro, siteButton, siteContainer } from "@/lib/ui/useable-components/site-chrome/ui"
import { CONFIG } from "@/utils/constants/config"

export const PublicCoursesScreen = () => {
  const { courses, loading: coursesLoading } = useCourses()
  const { enrolledCoursesFromApi, requestedCoursesFromApi } = useUser()
  const [searchQuery, setSearchQuery] = useState("")

  const enrolled = useMemo(
    () => new Set((enrolledCoursesFromApi ?? []).flatMap((c) => [c.id, c.slug]).filter(Boolean)),
    [enrolledCoursesFromApi]
  )
  const requested = useMemo(
    () => new Set((requestedCoursesFromApi ?? []).flatMap((c) => [c.id, c.slug]).filter(Boolean)),
    [requestedCoursesFromApi]
  )

  const catalog = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        tools: course.technologiesSection.technologies.map((t) => t.label),
        price: formatCoursePrice(course),
        freeTag: courseFreeTag(course),
        duration: formatCourseDuration(course),
      })),
    [courses]
  )

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return catalog
    return catalog.filter((c) =>
      [c.title, c.subtitle, c.duration, c.price, ...c.tools].some((v) => v.toLowerCase().includes(q))
    )
  }, [searchQuery, catalog])

  return (
    <div className="w-full">
      <PageIntro
        label="// courses"
        title="Pick a track. Ship real projects."
        description="Every course includes live lessons, assignments, a submission flow, marks on your dashboard and career support for top performers."
      >
        <label className="border-border bg-background focus-within:border-(--site-accent) flex w-full max-w-sm items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors">
          <SearchIcon className="text-muted-foreground size-4" aria-hidden />
          <span className="sr-only">Search courses</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses or tools…"
            className="placeholder:text-muted-foreground w-full bg-transparent outline-none"
          />
        </label>
      </PageIntro>

      <section className="py-14 sm:py-20">
        <div className={siteContainer}>
          <div className="text-muted-foreground mb-4 font-mono text-[11px]">
            {coursesLoading && !catalog.length ? "loading courses…" : `${filtered.length} of ${catalog.length} courses`}
          </div>
          <ul className="border-border border-t">
            {!coursesLoading && !filtered.length && (
              <li className="text-muted-foreground border-border border-b py-10 text-sm">
                {catalog.length ? "No course matches your search." : "No courses to show right now."}
              </li>
            )}
            {filtered.map((c, i) => {
              const isEnrolled = (c.id && enrolled.has(c.id)) || enrolled.has(c.slug)
              const isRequested = (c.id && requested.has(c.id)) || requested.has(c.slug)
              return (
                <li key={c.slug} className="border-border border-b py-6 sm:py-8">
                  <div className="grid gap-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                    <span className="text-muted-foreground font-mono text-[10px]">
                      T.{String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`${CONFIG.ROUTES.PUBLIC.COURSES}/${c.slug}`}
                        className="text-xl font-semibold tracking-tight transition-colors hover:text-(--site-accent) sm:text-2xl"
                      >
                        {c.title}
                      </Link>
                      {c.freeTag && <FreeTag className="ml-2 align-middle">{c.freeTag}</FreeTag>}
                      <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">{c.subtitle}</p>
                      <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px]">
                        <span>{c.duration}</span>
                        <span>{c.price}</span>
                        {c.tools.length > 0 && <span>{c.tools.slice(0, 5).join(" · ")}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`${CONFIG.ROUTES.PUBLIC.COURSES}/${c.slug}`} className={siteButton.outline}>
                        Details
                      </Link>
                      {isEnrolled || isRequested ? (
                        <span className="text-muted-foreground inline-flex items-center gap-1.5 px-2 font-mono text-[11px]">
                          <CheckIcon className="size-3.5" aria-hidden />
                          {isEnrolled ? "enrolled" : "requested"}
                        </span>
                      ) : (
                        <Link
                          href={`${CONFIG.ROUTES.PUBLIC.ENROLLMENT}?course=${encodeURIComponent(c.slug)}`}
                          className={cn(siteButton.primary)}
                        >
                          Enroll <ArrowRightIcon className="size-4" aria-hidden />
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </div>
  )
}
