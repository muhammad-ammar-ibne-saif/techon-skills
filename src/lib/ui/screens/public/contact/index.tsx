"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "@/lib/helpers"
import { useCourses } from "@/lib/providers/courses"
import { SimpleContactForm } from "@/lib/ui/screens/public/shared/simple-contact-form"
import {
  SITE_ADDRESS,
  SITE_EMAIL,
  SectionLabel,
  siteButton,
  siteContainer,
  siteDotGrid,
} from "@/lib/ui/useable-components/site-chrome/ui"
import { CONFIG, SITE_PHONE_DISPLAY, SITE_PHONE_TEL_HREF, SITE_WHATSAPP_URL } from "@/utils/constants"

export const PublicContactScreen = () => {
  const params = useSearchParams()
  const { getCourseBySlug } = useCourses()
  const selectedCourseFromUrl = params.get("course")
  const initialCourse = selectedCourseFromUrl ? getCourseBySlug(selectedCourseFromUrl) : null
  const [sent, setSent] = useState(false)

  const details = [
    { k: "phone", v: SITE_PHONE_DISPLAY, href: SITE_PHONE_TEL_HREF },
    { k: "whatsapp", v: "Chat with an advisor", href: SITE_WHATSAPP_URL },
    { k: "email", v: SITE_EMAIL, href: `mailto:${SITE_EMAIL}` },
    { k: "office", v: SITE_ADDRESS },
  ]

  return (
    <section className={cn("border-border/60 border-b", siteDotGrid)}>
      <div className={cn(siteContainer, "grid gap-12 py-14 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-start")}>
        <div>
          <SectionLabel>{"// contact"}</SectionLabel>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[3.25rem]">
            Let&apos;s plan your path.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-[15px] leading-relaxed">
            Tell us your goal and your current level. We&apos;ll recommend the right course and explain how lessons,
            assignments and marks work.
          </p>
          <dl className="border-border mt-8 border-t">
            {details.map((r) => (
              <div key={r.k} className="border-border grid grid-cols-[5.5rem_1fr] gap-4 border-b py-3.5">
                <dt className="font-mono text-xs text-(--site-accent)">{r.k}</dt>
                <dd className="text-sm">
                  {r.href ? (
                    <a
                      href={r.href}
                      target={r.href.startsWith("http") ? "_blank" : undefined}
                      rel={r.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="hover:text-(--site-accent) transition-colors"
                    >
                      {r.v}
                    </a>
                  ) : (
                    r.v
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={CONFIG.ROUTES.PUBLIC.ENROLLMENT} className={siteButton.primary}>
              Ready to enroll? <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
            <Link href={CONFIG.ROUTES.PUBLIC.FAQS} className="text-muted-foreground hover:text-foreground font-mono text-[11px]">
              read the faq →
            </Link>
          </div>
        </div>

        <div className="border-border bg-card rounded-xl border shadow-[0_24px_60px_-28px_rgba(15,15,40,0.35)]">
          <div className="border-border text-muted-foreground border-b px-6 py-3 font-mono text-[10px]">
            send us a message · we reply on email or whatsapp
          </div>
          <div className="p-6 sm:p-8" key={initialCourse?.slug ?? "none"}>
            <SimpleContactForm
              initialCourse={initialCourse ? { slug: initialCourse.slug, title: initialCourse.title } : null}
              sent={sent}
              onSuccess={() => setSent(true)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
