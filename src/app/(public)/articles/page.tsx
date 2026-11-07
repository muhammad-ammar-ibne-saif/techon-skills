import type { Metadata } from "next"

import { JsonLd, breadcrumbLd, orgRef } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { getSeoArticles } from "@/lib/seo/server-api"
import { SITE, absoluteUrl } from "@/lib/seo/site"
import { PublicArticlesScreen } from "@/lib/ui/screens/public/articles"

export const metadata: Metadata = pageMetadata({
  title: "Articles: Guides on Coding, Freelancing & Tech Careers",
  description:
    "Practical guides from TechOn Skills on learning web development, mobile apps, software engineering, e-commerce, freelancing and getting your first tech job in Pakistan.",
  path: "/articles",
})

export default async function ArticlesPage() {
  const articles = await getSeoArticles()
  return (
    <>
      <JsonLd
        data={[
          {
            "@type": "Blog",
            url: absoluteUrl("/articles"),
            name: `${SITE.name} articles`,
            publisher: orgRef,
            blogPost: articles.slice(0, 30).map((a) => ({
              "@type": "BlogPosting",
              headline: a.title,
              url: absoluteUrl(`/articles/${a.slug}`),
              ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
            })),
          },
          breadcrumbLd([{ name: "Articles", path: "/articles" }]),
        ]}
      />
      <PublicArticlesScreen />
    </>
  )
}
