"use client"

import { useQuery } from "@apollo/client/react"

import { cn } from "@/lib/helpers"
import { siteContainer } from "@/lib/ui/useable-components/site-chrome/ui"
import { GET_PUBLIC_PLACEMENT_STATS } from "@/lib/graphql"

type PublicStats = { graduates: number; placed: number; rate: number; companies: string[] }

/** "X% of our graduates are working": shown only once the API has enough confirmed placements. */
export function PlacementStatsBand({ className }: { className?: string }) {
  const { data } = useQuery<{ publicPlacementStats: PublicStats | null }>(GET_PUBLIC_PLACEMENT_STATS)
  const s = data?.publicPlacementStats
  if (!s) return null
  return (
    <section className={cn("border-y py-8", className)}>
      <div className={cn(siteContainer, "grid gap-6 sm:grid-cols-3 sm:items-center")}>
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">{Math.round(s.rate)}%</p>
          <p className="text-muted-foreground text-sm">of our graduates are working</p>
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">{s.placed}</p>
          <p className="text-muted-foreground text-sm">graduates hired so far</p>
        </div>
        {s.companies.length > 0 && (
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">They work at</p>
            <p className="mt-1 text-sm">{s.companies.slice(0, 8).join(" · ")}</p>
          </div>
        )}
      </div>
    </section>
  )
}
