"use client"

import { useState } from "react"
import { useQuery } from "@apollo/client/react"
import toast from "react-hot-toast"
import { CheckIcon, CopyIcon, GiftIcon, Loader2Icon, Share2Icon } from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/useable-components/card"
import { GET_MY_REFERRAL } from "@/lib/graphql"
import { cn, formatDate } from "@/lib/helpers"
import { CONFIG } from "@/utils/constants"

type MyReferral = {
  code: string
  totalEarned: number
  settings: { isActive: boolean; referrerReward: number; friendDiscount: number }
  referrals: { id: string; friendName: string; status: string; rewardAmount: number; rewardApplied: number; createdAt: string }[]
}

const STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Applied · waiting for approval", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  REWARDED: { label: "Enrolled · reward added", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  CREDIT_UNUSED: { label: "Enrolled · we'll settle your reward", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  CANCELLED: { label: "Not enrolled", className: "bg-muted text-muted-foreground" },
}

const pkr = (n: number) => `PKR ${n.toLocaleString()}`

/** The student's referral code and link, and the friends who used it. */
export const StudentReferScreen = () => {
  const { data, loading, error } = useQuery<{ getMyReferral: MyReferral }>(GET_MY_REFERRAL, { fetchPolicy: "network-only" })
  const [copied, setCopied] = useState<"code" | "link" | null>(null)
  const me = data?.getMyReferral
  const link = me && typeof window !== "undefined" ? `${window.location.origin}${CONFIG.ROUTES.PUBLIC.ENROLLMENT}?ref=${me.code}` : ""

  const copy = async (what: "code" | "link", text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error("Couldn't copy. Please copy it by hand.")
    }
  }

  const shareText = me
    ? `I'm learning at TechOn Skills. Enroll with my code ${me.code}${me.settings.friendDiscount > 0 ? ` and get ${pkr(me.settings.friendDiscount)} off` : ""}: ${link}`
    : ""

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8">
        <div className="text-sm font-semibold text-secondary">Refer a friend</div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Learn together, pay less</h1>
        {me && (
          <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
            For every friend who enrolls with your code, {pkr(me.settings.referrerReward)} comes off your next fee installment
            {me.settings.friendDiscount > 0 ? `, and your friend gets ${pkr(me.settings.friendDiscount)} off their course` : ""}.
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-12">
          <Loader2Icon className="size-5 animate-spin" /> Loading…
        </div>
      ) : error || !me ? (
        <p className="text-destructive">{error?.message ?? "Couldn't load your referral code."}</p>
      ) : (
        <div className="space-y-6">
          {!me.settings.isActive && (
            <div className="rounded-2xl border border-amber-400/50 bg-amber-50/60 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              The referral program is paused right now. Your code will work again when it restarts.
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardDescription>Your code</CardDescription>
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="font-mono text-3xl tracking-widest">{me.code}</CardTitle>
                  <Button size="sm" variant="outline" shape="pill" onClick={() => void copy("code", me.code)}>
                    {copied === "code" ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />} Copy code
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 break-all rounded-xl px-3 py-2 font-mono text-xs">{link}</div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" shape="pill" onClick={() => void copy("link", link)}>
                    {copied === "link" ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />} Copy link
                  </Button>
                  <Button asChild size="sm" shape="pill" className="bg-[#25D366] text-white hover:bg-[#25D366]/90">
                    <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                      <Share2Icon className="size-4" /> Share on WhatsApp
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5">
                  <GiftIcon className="size-4" /> Rewards earned
                </CardDescription>
                <CardTitle className="text-3xl">{pkr(me.totalEarned)}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {me.referrals.filter((r) => r.status === "REWARDED" || r.status === "CREDIT_UNUSED").length} friend(s) enrolled ·{" "}
                {me.referrals.filter((r) => r.status === "PENDING").length} waiting for approval
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Friends who used your code</h2>
            {me.referrals.length === 0 ? (
              <div className="text-muted-foreground rounded-3xl border border-dashed py-10 text-center text-sm">
                No one yet. Share your link with friends who want to learn.
              </div>
            ) : (
              <ul className="divide-y rounded-2xl border">
                {me.referrals.map((r) => {
                  const s = STATUS[r.status] ?? STATUS.PENDING!
                  return (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <span>
                        <span className="font-medium">{r.friendName}</span>
                        <span className="text-muted-foreground"> · {formatDate(r.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {(r.status === "REWARDED" || r.status === "CREDIT_UNUSED") && (
                          <span className="font-medium tabular-nums">{pkr(r.rewardAmount)}</span>
                        )}
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", s.className)}>{s.label}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
