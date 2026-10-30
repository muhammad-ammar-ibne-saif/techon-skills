"use client"

import Image from "next/image"
import { useQuery } from "@apollo/client/react"

import { cn, formatDateLong, getImageSrc, isBackendImageUrl } from "@/lib/helpers"
import { GET_ARTICLE_BY_SLUG } from "@/lib/graphql"
import { siteContainer } from "@/lib/ui/useable-components/site-chrome/ui"
import { PostLayout, PostNotFound, postProse } from "@/lib/ui/useable-components/site-chrome/post-layout"
import { CONFIG } from "@/utils/constants"

type ArticleDetail = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  authorName: string
  publishedAt: string | null
  metaTitle: string
  metaDescription: string
  createdAt: string
}

const ARTICLES = CONFIG.ROUTES.PUBLIC.ARTICLES

export const PublicArticleDetailScreen = ({ slug }: { slug: string }) => {
  const { data, loading, error } = useQuery<{ getArticleBySlug: ArticleDetail | null }>(GET_ARTICLE_BY_SLUG, {
    variables: { slug },
  })
  const article = data?.getArticleBySlug

  if (loading) {
    return <div className={cn(siteContainer, "text-muted-foreground py-24 font-mono text-xs")}>loading article…</div>
  }

  if (error || !article) {
    return (
      <PostNotFound
        title="Article not found"
        text="This article may be unpublished or the link is incorrect."
        backHref={ARTICLES}
        backLabel="Back to articles"
      />
    )
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    image: article.coverImage || undefined,
    author: article.authorName ? { "@type": "Person", name: article.authorName } : undefined,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.createdAt,
  }

  const meta = [
    "article",
    formatDateLong(article.publishedAt ?? article.createdAt),
    article.authorName && `by ${article.authorName}`,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <PostLayout backHref={ARTICLES} backLabel="all articles" meta={meta} title={article.title} intro={article.excerpt || undefined}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {article.coverImage && (
        <div className="border-border bg-muted/40 relative mb-10 aspect-video w-full overflow-hidden rounded-lg border">
          <Image
            src={getImageSrc(article.coverImage) || article.coverImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized={isBackendImageUrl(article.coverImage)}
          />
        </div>
      )}
      <div className={postProse} dangerouslySetInnerHTML={{ __html: article.content || "" }} />
    </PostLayout>
  )
}
