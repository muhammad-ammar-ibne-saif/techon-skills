import type { Metadata } from "next"

import { JsonLd, breadcrumbLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { PublicNewsScreen } from "@/lib/ui/screens/public/news"

export const metadata: Metadata = pageMetadata({
  title: "News & Announcements",
  description: "The latest from TechOn Skills: new courses and batches, events, student achievements and announcements.",
  path: "/news",
})

export default function NewsPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "News", path: "/news" }])} />
      <PublicNewsScreen />
    </>
  )
}
