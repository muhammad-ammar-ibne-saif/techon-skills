"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { useQuery } from "@apollo/client/react"
import { ArrowRightIcon, ClockIcon } from "lucide-react"

import { cn } from "@/lib/helpers"
import { GET_ACTIVE_DEALS } from "@/lib/graphql"
import { SectionLabel, SectionTitle, siteButton, siteContainer } from "@/lib/ui/useable-components/site-chrome/ui"

export type DealData = {
  id: string
  title: string
  description: string
  image: string
  badge: string
  courses: { id: string; title: string; slug: string }[]
  couponCode: string
  originalPrice: number | null
  dealPrice: number | null
  currency: string
  buttonLabel: string
  endsAtTime: string | null
  enrollUrl: string
}

/** Current time to the minute on the client; 0 while rendering on the server (no countdown there). */
function useMinuteClock() {
  return useSyncExternalStore(
    (onChange) => {
      const t = window.setInterval(onChange, 15000)
      return () => window.clearInterval(t)
    },
    () => Math.floor(Date.now() / 60000) * 60000,
    () => 0
  )
}

/** "Ends in 2d 5h", "Ends in 3h 12m", "Ends in 8m". */
export function timeLeftText(endsAt: string | null, now: number): string | null {
  if (!endsAt || !now) return null
  const ms = new Date(endsAt).getTime() - now
  if (!Number.isFinite(ms) || ms <= 0) return null
  const mins = Math.floor(ms / 60000)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  if (days > 0) return `Ends in ${days}d ${hours}h`
  if (hours > 0) return `Ends in ${hours}h ${mins % 60}m`
  return `Ends in ${Math.max(1, mins)}m`
}

const money = (currency: string, n: number) => `${currency} ${n.toLocaleString()}`

/** One deal: banner, ribbon, prices, countdown and a link to the enrollment form. */
export function DealCard({ deal, now }: { deal: DealData; now: number }) {
  const left = timeLeftText(deal.endsAtTime, now)
  const saving = deal.originalPrice != null && deal.dealPrice != null ? deal.originalPrice - deal.dealPrice : 0
  return (
    <article className="border-border bg-card group flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-[0_24px_60px_-28px_rgba(15,15,40,0.35)]">
      <div className="relative">
        {deal.image ? (
          <img src={deal.image} alt="" className="aspect-video w-full object-cover" loading="lazy" />
        ) : (
          <div className="aspect-video w-full bg-[linear-gradient(135deg,var(--site-accent),color-mix(in_oklab,var(--site-accent)_45%,black))]" />
        )}
        {deal.badge && (
          <span className="absolute top-3 left-3 rounded-md bg-(--site-accent) px-2.5 py-1 font-mono text-[11px] font-semibold text-white shadow-sm">
            {deal.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold tracking-tight">{deal.title}</h3>
        {deal.description && <p className="text-muted-foreground mt-1.5 whitespace-pre-line text-sm leading-relaxed">{deal.description}</p>}
        {deal.courses.length > 0 && (
          <div className="text-muted-foreground mt-3 font-mono text-[10px]">{deal.courses.map((c) => c.title).join(" · ")}</div>
        )}
        {deal.dealPrice != null && (
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-2xl font-semibold tracking-tight">{deal.dealPrice === 0 ? "Free" : money(deal.currency, deal.dealPrice)}</span>
            {deal.originalPrice != null && deal.originalPrice > deal.dealPrice && (
              <span className="text-muted-foreground text-sm line-through">{money(deal.currency, deal.originalPrice)}</span>
            )}
            {saving > 0 && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Save {money(deal.currency, saving)}</span>}
          </div>
        )}
        {deal.couponCode && (
          <div className="text-muted-foreground mt-3 text-xs">
            Code <span className="text-foreground rounded border border-dashed px-1.5 py-0.5 font-mono font-semibold">{deal.couponCode}</span> is
            filled in for you
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <span className={cn("text-muted-foreground inline-flex items-center gap-1.5 font-mono text-[11px]", !left && "invisible")}>
            <ClockIcon className="size-3.5" aria-hidden />
            {left ?? "–"}
          </span>
          <Link href={deal.enrollUrl} className={siteButton.primary}>
            {deal.buttonLabel || "Grab the deal"} <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}

/** Home page section with the deals set in Admin → Popup & deals. Hidden when none are running. */
export function DealsSection() {
  const { data } = useQuery<{ getActiveDeals: DealData[] }>(GET_ACTIVE_DEALS)
  const now = useMinuteClock()
  // Hide deals whose end passed while the page was open.
  const deals = (data?.getActiveDeals ?? []).filter((d) => !now || !d.endsAtTime || new Date(d.endsAtTime).getTime() > now)
  if (!deals.length) return null
  return (
    <section id="deals" className="border-border/60 scroll-mt-20 border-b py-20 sm:py-24">
      <div className={siteContainer}>
        <SectionLabel>{"// offers"}</SectionLabel>
        <SectionTitle>Deals running now.</SectionTitle>
        <div className={cn("mt-10 grid gap-5 sm:grid-cols-2", deals.length > 2 && "lg:grid-cols-3")}>
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} now={now} />
          ))}
        </div>
      </div>
    </section>
  )
}
