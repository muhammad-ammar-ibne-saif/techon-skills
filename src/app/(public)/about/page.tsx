import type { Metadata } from "next"

import { JsonLd, breadcrumbLd, orgRef, organizationLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { SITE, absoluteUrl } from "@/lib/seo/site"
import { PublicAboutScreen } from "@/lib/ui/screens/public/about"

export const metadata: Metadata = pageMetadata({
  title: "About Us: Project-Based Tech Institute in Lahore",
  description:
    "TechOn Skills, operated by Cloudrika Technologies, teaches web, mobile, software engineering and e-commerce through live online classes, real projects and career support. Based in Gulberg II, Lahore.",
  path: "/about",
})

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationLd(),
          { "@type": "AboutPage", url: absoluteUrl("/about"), name: `About ${SITE.name}`, about: orgRef, inLanguage: SITE.language },
          breadcrumbLd([{ name: "About", path: "/about" }]),
        ]}
      />
      <PublicAboutScreen />
    </>
  )
}
