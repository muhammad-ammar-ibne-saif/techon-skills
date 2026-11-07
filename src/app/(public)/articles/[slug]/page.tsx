import type { Metadata } from "next"

import { JsonLd, articleLd, breadcrumbLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { getSeoArticle } from "@/lib/seo/server-api"
import { snippet } from "@/lib/seo/site"
import { PublicArticleDetailScreen } from "@/lib/ui/screens/public/articles/detail"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const a = await getSeoArticle(slug)
  if (!a) return { title: "Article", robots: { index: false, follow: true } }
  return pageMetadata({
    title: a.metaTitle || a.title,
    description: snippet(a.metaDescription || a.excerpt),
    path: `/articles/${a.slug}`,
    image: a.coverImage || null,
    type: "article",
    publishedTime: a.publishedAt,
    modifiedTime: a.updatedAt,
    authors: a.authorName ? [a.authorName] : undefined,
  })
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params
  const a = await getSeoArticle(slug)
  return (
    <>
      {a && (
        <JsonLd
          data={[
            articleLd(a),
            breadcrumbLd([
              { name: "Articles", path: "/articles" },
              { name: a.title, path: `/articles/${a.slug}` },
            ]),
          ]}
        />
      )}
      <PublicArticleDetailScreen slug={slug} />
    </>
  )
}
