"use client"

import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@apollo/client/react"
import { ArrowRightIcon } from "lucide-react"

import { cn, formatDateLong, getImageSrc, isBackendImageUrl } from "@/lib/helpers"
import { GET_ARTICLES } from "@/lib/graphql"
import { PageIntro, siteContainer } from "@/lib/ui/useable-components/site-chrome/ui"
import { CONFIG } from "@/utils/constants"

type ArticleListItem = {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage: string
  authorName: string
  publishedAt: string | null
}

export const PublicArticlesScreen = () => {
  const { data, loading, error } = useQuery<{ getArticles: ArticleListItem[] }>(GET_ARTICLES, {
    variables: { publishedOnly: true },
  })
  const articles = data?.getArticles ?? []

  return (
    <div className="w-full">
      <PageIntro
        label="// articles"
        title="Notes from the build."
        description="Guides, tips and insights from TechOn Skills mentors to help you build your career in tech."
      />
      <section className="py-14 sm:py-20">
        <div className={siteContainer}>
          {loading ? (
            <p className="text-muted-foreground font-mono text-xs">loading articles…</p>
          ) : error ? (
            <p className="text-destructive text-sm">Couldn&apos;t load articles. Please refresh the page.</p>
          ) : articles.length === 0 ? (
            <p className="text-muted-foreground border-border border-y py-10 text-sm">
              No articles published yet. Check back soon.
            </p>
          ) : (
            <ul className="border-border border-t">
              {articles.map((a, i) => (
                <li key={a.id} className="border-border border-b">
                  <Link
                    href={`${CONFIG.ROUTES.PUBLIC.ARTICLES}/${a.slug}`}
                    className={cn(
                      "group grid gap-4 py-7 sm:items-center sm:gap-8",
                      a.coverImage ? "sm:grid-cols-[3rem_minmax(0,1fr)_12rem]" : "sm:grid-cols-[3rem_minmax(0,1fr)_1.5rem]"
                    )}
                  >
                    <span className="text-muted-foreground font-mono text-[10px]">A.{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <div className="text-muted-foreground font-mono text-[10px]">
                        {[a.publishedAt && formatDateLong(a.publishedAt), a.authorName].filter(Boolean).join(" · ")}
                      </div>
                      <h2 className="mt-1.5 text-xl font-semibold tracking-tight transition-colors group-hover:text-(--site-accent) sm:text-2xl">
                        {a.title}
                      </h2>
                      {a.excerpt && (
                        <p className="text-muted-foreground mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed">{a.excerpt}</p>
                      )}
                    </div>
                    {a.coverImage ? (
                      <div className="border-border bg-muted/40 relative aspect-video overflow-hidden rounded-md border">
                        <Image
                          src={getImageSrc(a.coverImage) || a.coverImage}
                          alt=""
                          fill
                          sizes="12rem"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          unoptimized={isBackendImageUrl(a.coverImage)}
                        />
                      </div>
                    ) : (
                      <ArrowRightIcon className="hidden size-4 transition-transform group-hover:translate-x-1 sm:block" aria-hidden />
                    )}
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
