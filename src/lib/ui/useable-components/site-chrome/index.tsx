"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/helpers"
import { useCourses } from "@/lib/providers/courses"
import { ContinueToDashboardDialog } from "@/lib/ui/useable-components/continue-dashboard-dialog"
import { ThemeSwitcher } from "@/lib/ui/useable-components/theme-switcher"
import { CONFIG, SITE_PHONE_DISPLAY, SITE_PHONE_TEL_HREF, SITE_WHATSAPP_URL } from "@/utils/constants"
import TechOnLogo from "@/lib/assets/techon-skills-logo-mark.png"
import { SITE_EMAIL, siteButton, siteContainer } from "./ui"

const ROUTES = CONFIG.ROUTES.PUBLIC

const NAV_LINKS = [
  { label: "Courses", href: ROUTES.COURSES },
  { label: "Method", href: "/#method" },
  { label: "Articles", href: ROUTES.ARTICLES },
  { label: "News", href: ROUTES.NEWS },
  { label: "About", href: ROUTES.ABOUT },
  { label: "Contact", href: ROUTES.CONTACT },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  const isActive = (href: string) => !href.startsWith("/#") && (pathname === href || pathname.startsWith(`${href}/`))

  return (
    <header
      className={cn(
        "bg-background/85 supports-backdrop-filter:bg-background/70 sticky top-0 z-40 border-b backdrop-blur transition-[box-shadow,border-color] duration-300",
        scrolled ? "border-border shadow-[0_6px_24px_-12px_rgba(15,15,40,0.25)]" : "border-border/50"
      )}
    >
      <div className={cn(siteContainer, "flex h-16 items-center justify-between gap-4")}>
        <Link
          href={ROUTES.HOME}
          className="shrink-0 transition-transform duration-300 hover:scale-105"
          aria-label="TechOn Skills home"
        >
          <Image src={TechOnLogo} alt="TechOn Skills" width={48} height={48} priority className="size-12" />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={cn(
                "relative py-1 font-mono text-xs transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-(--site-accent) after:transition-transform after:duration-300",
                isActive(l.href)
                  ? "text-foreground after:scale-x-100"
                  : "text-muted-foreground hover:text-foreground after:scale-x-0 hover:after:scale-x-100"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitcher className="hidden sm:inline-flex" />
          <ContinueToDashboardDialog
            plain
            className="hover:text-(--site-accent) cursor-pointer px-1 text-sm font-medium transition-colors"
          />
          <Link href={ROUTES.ENROLLMENT} className={siteButton.dark}>
            Enroll now
          </Link>
          <button
            type="button"
            className="hover:bg-muted/60 -mr-2 rounded-md p-2 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="border-border bg-background animate-in fade-in slide-in-from-top-2 border-t duration-200 lg:hidden"
          aria-label="Main"
        >
          <div className={cn(siteContainer, "flex flex-col py-2")}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-border/60 border-b py-3 font-mono text-sm last:border-b-0"
              >
                {l.label}
              </Link>
            ))}
            <div className="py-3 sm:hidden">
              <ThemeSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}

export function SiteFooter() {
  const { courses } = useCourses()
  const linkCls = "font-mono text-[11px] text-white/55 transition-colors hover:text-white"
  const groups: {
    word: string
    accent?: boolean
    links: { label: string; href: string }[]
  }[] = [
    {
      word: "Learn.",
      links: [
        ...courses.slice(0, 4).map((c) => ({
          label: c.title,
          href: `${ROUTES.COURSES}/${c.slug}`,
        })),
        { label: "All courses", href: ROUTES.COURSES },
      ],
    },
    {
      word: "Build.",
      links: [
        { label: "Method", href: "/#method" },
        { label: "Projects", href: "/#build" },
        { label: "Articles", href: ROUTES.ARTICLES },
        { label: "News", href: ROUTES.NEWS },
        { label: "Dashboard", href: CONFIG.ROUTES.STUDENT.DASHBOARD },
      ],
    },
    {
      word: "Grow.",
      accent: true,
      links: [
        { label: "How to enroll", href: "/#fees" },
        { label: "Enroll", href: ROUTES.ENROLLMENT },
        { label: "About", href: ROUTES.ABOUT },
        { label: "Contact", href: ROUTES.CONTACT },
      ],
    },
  ]
  return (
    <footer className="bg-[#0d0d14] text-white">
      <div className={cn(siteContainer, "pt-16 pb-8")}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xs text-2xl font-semibold leading-tight tracking-tight">
            Not sure which course fits you?
          </p>
          <a
            href={`${SITE_WHATSAPP_URL}?text=${encodeURIComponent("Hi, I need help choosing a course.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[#0d0d14] transition-opacity hover:opacity-90"
          >
            Chat with an advisor →
          </a>
        </div>

        <div className="mt-16 space-y-2">
          {groups.map((g) => (
            <div key={g.word} className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div
                className={cn(
                  "text-[clamp(4rem,13vw,9.5rem)] font-bold leading-[0.95] tracking-[-0.06em]",
                  g.accent && "text-[#7b78ff]"
                )}
              >
                {g.word}
              </div>
              <nav className="flex flex-wrap gap-x-6 gap-y-1 pb-4" aria-label={g.word}>
                {g.links.map((l) => (
                  <Link key={l.href} href={l.href} className={linkCls}>
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src={TechOnLogo} alt="TechOn Skills" width={40} height={40} className="size-10 shrink-0" />
            <p className="font-mono text-[10px] leading-relaxed text-white/45">
              © {new Date().getFullYear()} TechOn Skills · Cloudrika Technologies, Lahore ·{" "}
              <a href={SITE_PHONE_TEL_HREF} className="hover:text-white">
                {SITE_PHONE_DISPLAY}
              </a>{" "}
              ·{" "}
              <a href={`mailto:${SITE_EMAIL}`} className="hover:text-white">
                {SITE_EMAIL}
              </a>
            </p>
          </div>
          <nav className="flex flex-wrap gap-5" aria-label="Legal">
            {[
              { label: "FAQs", href: ROUTES.FAQS },
              { label: "Terms", href: ROUTES.TERMS_OF_SERVICE },
              { label: "Privacy", href: ROUTES.PRIVACY_POLICY },
              { label: "Refunds", href: ROUTES.REFUND_POLICY },
            ].map((l) => (
              <Link key={l.href} href={l.href} className={cn(linkCls, "text-[10px]")}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
