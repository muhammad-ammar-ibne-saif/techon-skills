import type { Metadata } from "next"

import { JsonLd, breadcrumbLd, newsLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { getSeoNews } from "@/lib/seo/server-api"
import { snippet } from "@/lib/seo/site"
import { PublicNewsDetailScreen } from "@/lib/ui/screens/public/news/detail"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const n = await getSeoNews(id)
  if (!n) return { title: "News", robots: { index: false, follow: true } }
  return pageMetadata({
    title: n.title,
    description: snippet(n.description),
    path: `/news/${n.id}`,
    type: "article",
    publishedTime: n.createdAt,
    modifiedTime: n.updatedAt,
  })
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params
  const n = await getSeoNews(id)
  return (
    <>
      {n && (
        <JsonLd
          data={[
            newsLd(n),
            breadcrumbLd([
              { name: "News", path: "/news" },
              { name: n.title, path: `/news/${n.id}` },
            ]),
          ]}
        />
      )}
      <PublicNewsDetailScreen id={id} />
    </>
  )
}
