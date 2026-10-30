"use client"

import Link from "next/link"
import { useQuery } from "@apollo/client/react"
import { ArrowRightIcon } from "lucide-react"

import { formatDateLong } from "@/lib/helpers"
import { GET_NEWS_POSTS } from "@/lib/graphql"
import { PageIntro, siteContainer } from "@/lib/ui/useable-components/site-chrome/ui"
import { CONFIG } from "@/utils/constants"

type NewsListItem = { id: string; title: string; description: string; createdAt?: string }

export const PublicNewsScreen = () => {
  const { data, loading, error } = useQuery<{ getNewsPosts: NewsListItem[] }>(GET_NEWS_POSTS)
  const posts = data?.getNewsPosts ?? []

  return (
    <div className="w-full">
      <PageIntro
        label="// news"
        title="What's new at TechOn Skills."
        description="Announcements, new course launches and batch updates."
      />
      <section className="py-14 sm:py-20">
        <div className={siteContainer}>
          {loading ? (
            <p className="text-muted-foreground font-mono text-xs">loading news…</p>
          ) : error ? (
            <p className="text-destructive text-sm">Couldn&apos;t load news. Please refresh the page.</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground border-border border-y py-10 text-sm">No news yet. Check back soon.</p>
          ) : (
            <ul className="border-border border-t">
              {posts.map((p, i) => (
                <li key={p.id} className="border-border border-b">
                  <Link
                    href={`${CONFIG.ROUTES.PUBLIC.NEWS}/${p.id}`}
                    className="group grid gap-3 py-7 sm:grid-cols-[3rem_minmax(0,1fr)_1.5rem] sm:items-center sm:gap-8"
                  >
                    <span className="text-muted-foreground font-mono text-[10px]">N.{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      {p.createdAt && (
                        <div className="text-muted-foreground font-mono text-[10px]">{formatDateLong(p.createdAt)}</div>
                      )}
                      <h2 className="mt-1.5 text-xl font-semibold tracking-tight transition-colors group-hover:text-(--site-accent) sm:text-2xl">
                        {p.title}
                      </h2>
                      <p className="text-muted-foreground mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed">{p.description}</p>
                    </div>
                    <ArrowRightIcon className="hidden size-4 transition-transform group-hover:translate-x-1 sm:block" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
