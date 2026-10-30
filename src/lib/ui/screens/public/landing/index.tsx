"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useQuery } from "@apollo/client/react"
import { ArrowRightIcon, CheckIcon, ChevronRightIcon, StarIcon } from "lucide-react"

import { cn } from "@/lib/helpers"
import { GET_PUBLIC_SITE_STATS } from "@/lib/graphql"
import { useCourses } from "@/lib/providers/courses"
import {
  SectionLabel,
  SectionTitle,
  siteButton,
  siteContainer,
  siteDotGrid,
} from "@/lib/ui/useable-components/site-chrome/ui"
import { CONFIG, SITE_WHATSAPP_URL } from "@/utils/constants"
import { FAQS } from "@/utils/constants/faqs"
import { GOOGLE_RATING, GOOGLE_REVIEWS, GOOGLE_WRITE_REVIEW_URL } from "@/utils/constants/google-reviews"
import type { ICourse } from "@/utils/interfaces"

const ROUTES = CONFIG.ROUTES.PUBLIC

type PublicSiteStats = {
  students: number
  projectsMarked: number
  mentors: number
  courses: number
  lowestCourseFee: number | null
  currency: string | null
}

/** FAQ entries (from the FAQ page) shown in the home page's short FAQ. */
const HOME_FAQ_QUESTIONS = [
  "How much do courses cost?",
  "How are classes delivered?",
  "Do you offer career support?",
  "Can I get a refund if I change my mind?",
]

export const LandingPageScreen = () => {
  const { courses, loading: coursesLoading } = useCourses()
  const { data: statsData } = useQuery<{ publicSiteStats: PublicSiteStats }>(GET_PUBLIC_SITE_STATS)
  const stats = statsData?.publicSiteStats ?? null

  return (
    <div className="w-full min-w-0">
      <Hero courses={courses} />
      <BuildSection />
      <TracksSection courses={courses} loading={coursesLoading} />
      <MethodSection />
      <ResultsSection stats={stats} />
      <FeesAndFaqSection />
    </div>
  )
}

function Hero({ courses }: { courses: ICourse[] }) {
  const sampleCourse = courses[0]?.title ?? "Full-Stack Web"
  return (
    <section id="top" className={cn("border-border/60 relative border-b", siteDotGrid)}>
      <div className={cn(siteContainer, "grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24")}>
        <div className="site-intro">
          <SectionLabel>{"// learn. build. grow."}</SectionLabel>
          <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-[4.25rem]">
            Learn it. Build it. Get <span className="text-(--site-accent)">marked</span> on it.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-md text-[15px] leading-relaxed">
            Courses in AI, data, web and mobile where every lesson ends in a graded project and a mentor review.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#courses" className={siteButton.primary}>
              Browse courses <ArrowRightIcon className="size-4" aria-hidden />
            </a>
            <a
              href={`${SITE_WHATSAPP_URL}?text=${encodeURIComponent("Hi, I'd like a free advisor call about your courses.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className={siteButton.outline}
            >
              Free advisor call
            </a>
          </div>
          <ul className="text-muted-foreground mt-6 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]">
            {["graded projects", "mentor code review", "progress dashboard"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckIcon className="size-3" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <DashboardPreview courseTitle={sampleCourse} />
      </div>
    </section>
  )
}

/** Illustration of the student dashboard (sample data, labelled as such). */
function DashboardPreview({ courseTitle }: { courseTitle: string }) {
  const progress = 62
  const r = 22
  const circumference = 2 * Math.PI * r
  return (
    <div className="site-hero-art relative mx-auto w-full max-w-md lg:ml-auto" aria-hidden>
      <div className="border-border bg-card rounded-xl border shadow-[0_24px_60px_-28px_rgba(15,15,40,0.35)]">
        <div className="border-border flex items-center gap-1.5 border-b px-4 py-2.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="bg-muted-foreground/25 size-2 rounded-full" />
          ))}
          <span className="text-muted-foreground ml-2 font-mono text-[10px]">dashboard · sample view</span>
        </div>
        <div className="flex items-center gap-4 px-5 py-5">
          <svg viewBox="0 0 56 56" className="size-14 -rotate-90">
            <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-muted" />
            <circle
              cx="28"
              cy="28"
              r={r}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              stroke="var(--site-accent)"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
            />
            <text
              x="28"
              y="32"
              textAnchor="middle"
              className="fill-foreground text-[11px] font-semibold"
              transform="rotate(90 28 28)"
            >
              {progress}%
            </text>
          </svg>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{courseTitle}</div>
            <div className="text-muted-foreground font-mono text-[10px]">Module 4 of 8</div>
          </div>
        </div>
        <ul className="border-border divide-border divide-y border-t text-xs">
          {[
            { t: "Routing and layouts", done: true },
            { t: "API integration", done: true },
            { t: "Project: deploy your app", done: false },
          ].map((row) => (
            <li
              key={row.t}
              className={cn(
                "flex items-center justify-between px-5 py-2.5",
                !row.done && "bg-(--site-accent)/8 font-medium"
              )}
            >
              <span>{row.t}</span>
              {row.done && <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">done</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-foreground text-background absolute -right-3 bottom-10 w-52 rounded-lg px-3.5 py-3 shadow-xl sm:-right-8">
        <div className="font-mono text-[9px] tracking-wider opacity-60">MENTOR REVIEW</div>
        <div className="mt-1 text-[11px] leading-snug">
          &ldquo;Clean structure. Add loading states, then ship it.&rdquo;
        </div>
      </div>
      <div className="border-border bg-card absolute -bottom-9 left-4 flex items-center gap-3 rounded-lg border px-3 py-2 shadow-md">
        <span className="font-mono text-xl font-semibold text-emerald-600 dark:text-emerald-400">86</span>
        <span className="text-muted-foreground font-mono text-[9px] leading-tight">
          MARK / 100
          <br />
          status: passed
        </span>
      </div>
    </div>
  )
}

const BUILD_ITEMS = [
  {
    tag: "WEB & MOBILE",
    title: "Production Next.js and React Native apps",
    art: "browser",
  },
  { tag: "AI & ML", title: "AI agents and RAG pipelines", art: "chat" },
  { tag: "DATA & BI", title: "Dashboards on real datasets", art: "chart" },
  { tag: "DESIGN", title: "Figma design systems", art: "grid" },
] as const

function BuildArt({ kind }: { kind: (typeof BUILD_ITEMS)[number]["art"] }) {
  const frame = "border-border bg-muted/40 relative h-28 overflow-hidden rounded-md border"
  if (kind === "browser")
    return (
      <div className={frame}>
        <div className="bg-background border-border absolute inset-x-3 top-3 bottom-0 rounded-t border-x border-t p-3">
          <div className="build-type bg-foreground h-1.5 w-12 rounded-full" />
          <div className="build-type build-type-2 bg-muted-foreground/25 mt-2 h-1 w-24 rounded-full" />
          <div className="build-type build-type-3 bg-muted-foreground/25 mt-1.5 h-1 w-20 rounded-full" />
          <div className="relative mt-3 w-fit">
            <div className="build-press h-5 w-24 rounded bg-(--site-accent)" />
            <svg viewBox="0 0 12 16" className="build-cursor text-foreground absolute top-2.5 left-16 hidden size-3.5">
              <path d="M1 1 L1 13 L4.2 10 L6.4 15 L8.4 14.1 L6.2 9.2 L10.5 9.2 Z" fill="currentColor" stroke="white" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>
    )
  if (kind === "chat")
    return (
      <div className={cn(frame, "flex flex-col justify-center gap-2 px-4")}>
        <div className="build-msg-1 bg-background border-border w-fit rounded-md border px-2 py-1 text-[9px]">
          Summarise this document
        </div>
        <div className="ml-auto grid justify-items-end">
          <div className="build-typing bg-background border-border flex gap-0.5 rounded-md border px-2 py-1.5 opacity-0 [grid-area:1/1]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="bg-muted-foreground size-1 rounded-full" />
            ))}
          </div>
          <div className="build-msg-2 w-fit rounded-md bg-(--site-accent) px-2 py-1 text-[9px] text-white [grid-area:1/1]">
            Done. 3 key points found.
          </div>
        </div>
        <div className="text-muted-foreground text-center font-mono text-[8px]">agent · retrieval · tools</div>
      </div>
    )
  if (kind === "chart")
    return (
      <div className={cn(frame, "flex items-end justify-center gap-2 px-4 pb-3")}>
        {[40, 55, 45, 95, 60].map((h, i) => (
          <div
            key={i}
            className={cn("build-bar w-5 rounded-sm", i === 3 ? "bg-(--site-accent)" : "bg-muted-foreground/20")}
            style={{ height: `${h}%`, animationDelay: `${-i * 0.45}s` }}
          />
        ))}
      </div>
    )
  return (
    <div className={cn(frame, "grid grid-cols-2 gap-1.5 p-3")}>
      <div className="build-tile bg-foreground rounded-sm" />
      <div className="build-tile build-tile-2 bg-muted-foreground/20 rounded-sm" />
      <div className="build-tile build-tile-3 bg-muted-foreground/20 rounded-sm" />
      <div className="relative overflow-hidden rounded-sm border border-dashed border-(--site-accent)">
        <div className="build-fill absolute inset-0.5 scale-0 rounded-[2px] bg-(--site-accent)/25" />
      </div>
    </div>
  )
}

function BuildSection() {
  return (
    <section id="build" className="scroll-mt-20 py-20 sm:py-24">
      <div className={siteContainer}>
        <SectionLabel>{"// 001 what you build"}</SectionLabel>
        <SectionTitle>Real projects, not slides.</SectionTitle>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BUILD_ITEMS.map((b) => (
            <article key={b.title} className="border-border bg-card rounded-lg border p-3 pb-5">
              <BuildArt kind={b.art} />
              <div className="text-muted-foreground mt-4 px-1 font-mono text-[10px]">{b.tag}</div>
              <h3 className="mt-1 px-1 text-[15px] font-semibold leading-snug">{b.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Numbered course rows, also used on the courses page. */
export function CourseRows({ courses, loading }: { courses: ICourse[]; loading: boolean }) {
  return (
    <ul className="border-border border-t">
      {loading && !courses.length && (
        <li className="text-muted-foreground border-border border-b py-8 font-mono text-xs">loading courses…</li>
      )}
      {!loading && !courses.length && (
        <li className="text-muted-foreground border-border border-b py-8 text-sm">
          No courses to show right now. Message us on WhatsApp for the next intake.
        </li>
      )}
      {courses.map((c, i) => {
        const tools = c.technologiesSection.technologies
          .slice(0, 3)
          .map((t) => t.label)
          .join(", ")
        return (
          <li key={c.slug} className="border-border border-b">
            <Link
              href={`${ROUTES.COURSES}/${c.slug}`}
              className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 gap-y-1 py-5 sm:grid-cols-[3rem_minmax(0,1.3fr)_minmax(0,1fr)_auto_1.5rem] sm:py-6"
            >
              <span className="text-muted-foreground font-mono text-[10px]">T.{String(i + 1).padStart(2, "0")}</span>
              <span className="text-lg font-semibold tracking-tight transition-colors group-hover:text-(--site-accent) sm:text-2xl">
                {c.title}
              </span>
              <span className="text-muted-foreground col-start-2 row-start-2 truncate text-xs sm:col-start-auto sm:row-start-auto">
                {tools || c.subtitle}
              </span>
              <span className="text-muted-foreground col-start-2 row-start-3 font-mono text-[10px] sm:col-start-auto sm:row-start-auto sm:text-right">
                {c.courseDurationInMonths} months
              </span>
              <ArrowRightIcon
                className="col-start-3 row-start-1 size-4 transition-transform group-hover:translate-x-1 sm:col-start-auto sm:row-start-auto"
                aria-hidden
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function TracksSection({ courses, loading }: { courses: ICourse[]; loading: boolean }) {
  return (
    <section id="courses" className="scroll-mt-20 py-20 sm:py-24">
      <div className={siteContainer}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>{"// 002 courses"}</SectionLabel>
            <SectionTitle>Pick a track.</SectionTitle>
          </div>
          <Link href={ROUTES.COURSES} className="text-muted-foreground hover:text-foreground font-mono text-[11px]">
            all courses →
          </Link>
        </div>
        <div className="mt-10">
          <CourseRows courses={courses} loading={loading} />
        </div>
      </div>
    </section>
  )
}

export const METHOD_STEPS = [
  { t: "Learn", d: "Short lessons with one clear outcome." },
  { t: "Practice", d: "Build it yourself the same day." },
  { t: "Submit", d: "Send your project through the dashboard." },
  { t: "Get marked", d: "Mentor feedback and a mark that stays on record." },
]

/** Numbered steps joined by a dashed line; the last step is highlighted. */
export function StepLoop({ steps }: { steps: { t: string; d: string }[] }) {
  return (
    <ol className={cn("grid gap-8 sm:grid-cols-2 lg:gap-6", steps.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1
        return (
          <li key={s.t} className="relative">
            {!last && (
              <span
                aria-hidden
                className="border-border absolute top-3 left-8 hidden w-[calc(100%-1rem)] border-t border-dashed lg:block"
              />
            )}
            <span
              className={cn(
                "relative flex size-6 items-center justify-center rounded-full border font-mono text-[10px]",
                last ? "border-(--site-accent) bg-(--site-accent) text-white" : "border-foreground bg-background"
              )}
            >
              {i + 1}
            </span>
            <div className="mt-4 text-[15px] font-semibold">{s.t}</div>
            <p className="text-muted-foreground mt-1 max-w-56 text-xs leading-relaxed">{s.d}</p>
          </li>
        )
      })}
    </ol>
  )
}

function MethodSection() {
  return (
    <section id="method" className="scroll-mt-20 py-20 sm:py-24">
      <div className={siteContainer}>
        <SectionLabel>{"// 003 method"}</SectionLabel>
        <SectionTitle>One loop in every lesson.</SectionTitle>
        <div className="mt-12">
          <StepLoop steps={METHOD_STEPS} />
        </div>
      </div>
    </section>
  )
}

/** Bordered row of big numbers with small mono captions. */
export function StatGrid({ cells }: { cells: { value: string; label: string }[] }) {
  return (
    <dl className="border-border grid grid-cols-2 overflow-hidden rounded-lg border lg:grid-cols-4">
      {cells.map((c, i) => (
        <div
          key={c.label}
          className={cn(
            "border-border px-5 py-6 sm:px-6",
            i % 2 === 1 && "border-l",
            i >= 2 && "border-t lg:border-t-0",
            i === 2 && "lg:border-l"
          )}
        >
          <dd className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            <CountUp value={c.value} />
          </dd>
          <dt className="text-muted-foreground mt-2 font-mono text-[10px]">{c.label}</dt>
        </div>
      ))}
    </dl>
  )
}

/** Counts a leading number ("120+") up from 0 the first time it scrolls into view. */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const match = /^(\d[\d,]*)(.*)$/.exec(value)
  const target = match ? Number(match[1]!.replace(/,/g, "")) : null
  const [shown, setShown] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || target == null || target === 0) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 900)
        setShown(Math.round(target * (1 - (1 - p) ** 3)))
        if (p < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target])

  return <span ref={ref}>{match && shown != null ? `${shown.toLocaleString()}${match[2]}` : value}</span>
}

export function statCells(stats: PublicSiteStats | null) {
  const n = (v: number | undefined) => (v == null ? "—" : v.toLocaleString())
  return [
    {
      value: stats ? `${n(stats.students)}${stats.students > 0 ? "+" : ""}` : "—",
      label: "students",
    },
    { value: n(stats?.projectsMarked), label: "projects marked" },
    { value: n(stats?.mentors), label: "mentors" },
    { value: n(stats?.courses), label: "courses" },
  ]
}

function ResultsSection({ stats }: { stats: PublicSiteStats | null }) {
  return (
    <section id="results" className="scroll-mt-20 py-20 sm:py-24">
      <div className={siteContainer}>
        <SectionLabel>{"// 004 results"}</SectionLabel>
        <SectionTitle>Proof, not promises.</SectionTitle>
        <div className="mt-10">
          <StatGrid cells={statCells(stats)} />
        </div>
        <GoogleReviews />
      </div>
    </section>
  )
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          aria-hidden
          className={cn("size-3.5", i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-border")}
        />
      ))}
    </span>
  )
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white font-bold shadow-sm ring-1 ring-black/5",
        className
      )}
    >
      <span className="bg-[conic-gradient(#ea4335_0_25%,#fbbc05_0_50%,#34a853_0_75%,#4285f4_0)] bg-clip-text text-transparent">
        G
      </span>
    </span>
  )
}

const AVATAR_COLORS = ["#1a5fb4", "#8d6e63", "#c2410c", "#ea580c", "#5b5bd6", "#0f766e", "#be185d", "#4d7c0f", "#7c3aed"]

function avatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function ReviewCard({ review }: { review: (typeof GOOGLE_REVIEWS)[number] }) {
  return (
    <li className="border-border bg-card flex h-56 w-[17.5rem] shrink-0 flex-col rounded-xl border p-5 shadow-sm sm:w-[19rem]">
      <div className="flex items-center gap-3">
        <span className="relative shrink-0">
          <span
            className="flex size-10 items-center justify-center rounded-full text-base font-semibold text-white"
            style={{ backgroundColor: avatarColor(review.authorName) }}
          >
            {review.authorName.charAt(0).toUpperCase()}
          </span>
          <GoogleMark className="absolute -right-1 -bottom-1 size-4 text-[9px]" />
        </span>
        <span className="truncate text-[15px] font-medium">{review.authorName}</span>
      </div>
      <Stars rating={review.rating} className="mt-3" />
      <p className="text-foreground/80 mt-2 line-clamp-4 text-sm leading-relaxed">{review.text}</p>
      <div className="text-muted-foreground mt-auto pt-2 text-right font-mono text-[10px]">
        {review.relativeTime ?? "Google review"}
      </div>
    </li>
  )
}

/** Google reviews (fixed list in utils/constants/google-reviews.ts) in an auto-moving row, plus a link to write one. */
function GoogleReviews() {
  const reviews = GOOGLE_REVIEWS
  if (reviews.length === 0 && !GOOGLE_WRITE_REVIEW_URL) return null

  return (
    <div className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-muted-foreground font-mono text-[10px]">google reviews</div>
          <div className="mt-2 text-xl font-semibold tracking-tight">What our students say</div>
          <div className="border-border bg-card mt-3 inline-flex items-center gap-2.5 rounded-full border py-1.5 pr-4 pl-1.5 shadow-sm">
            <GoogleMark className="size-7 text-sm" />
            <span className="text-lg font-semibold tabular-nums">{GOOGLE_RATING.toFixed(1)}</span>
            <Stars rating={GOOGLE_RATING} />
            <span className="text-muted-foreground text-xs">rating on Google</span>
          </div>
        </div>
        {GOOGLE_WRITE_REVIEW_URL && (
          <a href={GOOGLE_WRITE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className={siteButton.primary}>
            Write a review <ArrowRightIcon className="size-4" aria-hidden />
          </a>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="site-marquee mt-8 -mx-4 overflow-hidden px-4 py-2 sm:mx-0 sm:px-0" aria-label="Google reviews">
          <div className="site-marquee-track flex w-max">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1 || undefined} className={cn("flex gap-4 pr-4", copy === 1 && "site-marquee-copy")}>
                {reviews.map((r) => (
                  <ReviewCard key={r.authorName} review={r} />
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Expandable question rows (native details/summary). */
export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="border-border border-t">
      {items.map((f) => (
        <details key={f.question} className="group border-border border-b">
          <summary className="flex cursor-pointer list-none items-center gap-3 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <ChevronRightIcon
              className="size-3.5 shrink-0 fill-current transition-transform group-open:rotate-90"
              aria-hidden
            />
            {f.question}
          </summary>
          <p className="text-muted-foreground pb-4 pl-6 text-sm leading-relaxed">{f.answer}</p>
        </details>
      ))}
    </div>
  )
}

const FEE_STEPS = ["Choose your course", "Pay and upload receipt", "Get approved", "Open your dashboard"]

function FeesAndFaqSection() {
  const faqs = HOME_FAQ_QUESTIONS.map((q) => FAQS.find((f) => f.question === q)).filter(
    (f): f is (typeof FAQS)[number] => Boolean(f)
  )
  return (
    <section id="fees" className="scroll-mt-20 py-20 sm:py-24">
      <div className={cn(siteContainer, "grid gap-14 lg:grid-cols-2 lg:gap-16")}>
        <div>
          <SectionLabel>{"// 005 enrollment"}</SectionLabel>
          <SectionTitle>Simple to start.</SectionTitle>
          <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed">
            Choose a course, pay the fee and upload your receipt. Your account is activated as soon as we confirm your
            payment. Each course page shows its fee.
          </p>
          <ol className="border-border mt-6 border-t">
            {FEE_STEPS.map((s, i) => (
              <li key={s} className="border-border flex gap-4 border-b py-2.5 font-mono text-xs">
                <span className="text-(--site-accent)">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
          <Link href={ROUTES.ENROLLMENT} className={cn(siteButton.primary, "mt-7")}>
            Start enrollment <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>
        <div id="faq" className="scroll-mt-20">
          <SectionLabel>{"// 006 faq"}</SectionLabel>
          <div className="mt-6 lg:mt-[4.6rem]">
            <FaqList items={faqs} />
            <Link
              href={ROUTES.FAQS}
              className="text-muted-foreground hover:text-foreground mt-4 inline-block font-mono text-[11px]"
            >
              all questions →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
