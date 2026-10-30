"use client"

import Link from "next/link"
import { useQuery } from "@apollo/client/react"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "@/lib/helpers"
import { GET_PUBLIC_SITE_STATS } from "@/lib/graphql"
import { METHOD_STEPS, StatGrid, statCells, StepLoop } from "@/lib/ui/screens/public/landing"
import {
  PageIntro,
  SITE_ADDRESS,
  SITE_EMAIL,
  SectionLabel,
  SectionTitle,
  siteButton,
  siteContainer,
} from "@/lib/ui/useable-components/site-chrome/ui"
import { CONFIG, SITE_PHONE_DISPLAY } from "@/utils/constants"

const PRINCIPLES = [
  { title: "Practical", text: "Every lesson ends in something you build: real projects and real workflows, not slides." },
  { title: "Measurable", text: "Assignments are marked by mentors, so your progress is visible on your dashboard." },
  { title: "Focused", text: "Short lessons, one clear outcome each, and a consistent loop that keeps you moving." },
]

export const PublicAboutScreen = () => {
  const { data } = useQuery<{ publicSiteStats: Parameters<typeof statCells>[0] }>(GET_PUBLIC_SITE_STATS)

  return (
    <div className="w-full">
      <PageIntro
        label="// about"
        title="Learn with structure. Build with confidence."
        description="TechOn Skills is a practical, project-based training platform by Cloudrika Technologies in Lahore. We teach through live lessons, hands-on assignments and a dashboard that tracks your marks."
      >
        <Link href={CONFIG.ROUTES.PUBLIC.COURSES} className={siteButton.primary}>
          Browse courses <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
        <Link href={CONFIG.ROUTES.PUBLIC.CONTACT} className={siteButton.outline}>
          Talk to us
        </Link>
      </PageIntro>

      <section className="py-16 sm:py-20">
        <div className={siteContainer}>
          <SectionLabel>{"// 001 principles"}</SectionLabel>
          <SectionTitle>What we care about.</SectionTitle>
          <div className="border-border mt-10 grid overflow-hidden rounded-lg border md:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <div key={p.title} className={cn("border-border p-6", i > 0 && "border-t md:border-t-0 md:border-l")}>
                <div className="text-muted-foreground font-mono text-[10px]">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{p.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className={siteContainer}>
          <SectionLabel>{"// 002 method"}</SectionLabel>
          <SectionTitle>One loop in every lesson.</SectionTitle>
          <div className="mt-12">
            <StepLoop steps={METHOD_STEPS} />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className={siteContainer}>
          <SectionLabel>{"// 003 in numbers"}</SectionLabel>
          <SectionTitle>Proof, not promises.</SectionTitle>
          <div className="mt-10">
            <StatGrid cells={statCells(data?.publicSiteStats ?? null)} />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className={cn(siteContainer, "grid gap-10 lg:grid-cols-2")}>
          <div>
            <SectionLabel>{"// 004 who we are"}</SectionLabel>
            <SectionTitle>Built by Cloudrika Technologies.</SectionTitle>
            <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed">
              Career support is for students whose work consistently stands out: introductions and guidance toward real
              opportunities. It isn&apos;t a guaranteed placement, and we don&apos;t claim it is.
            </p>
          </div>
          <dl className="border-border self-end border-t font-mono text-xs">
            {[
              { k: "phone", v: SITE_PHONE_DISPLAY },
              { k: "email", v: SITE_EMAIL },
              { k: "office", v: SITE_ADDRESS },
            ].map((r) => (
              <div key={r.k} className="border-border grid grid-cols-[5rem_1fr] gap-4 border-b py-3">
                <dt className="text-(--site-accent)">{r.k}</dt>
                <dd className="text-foreground/90 font-sans text-sm">{r.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  )
}
