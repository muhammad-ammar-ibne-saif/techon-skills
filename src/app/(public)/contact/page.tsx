import type { Metadata } from "next"
import { Suspense } from "react"

import { JsonLd, breadcrumbLd, orgRef, organizationLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { SITE, absoluteUrl } from "@/lib/seo/site"
import { PublicContactScreen } from "@/lib/ui/screens/public/contact"

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description: `Talk to TechOn Skills about courses, fees and enrollment. Call or WhatsApp ${SITE.phone}, email ${SITE.email}, or visit us at Al Hafeez Executive Towers, Gulberg II, Lahore.`,
  path: "/contact",
})

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationLd(),
          { "@type": "ContactPage", url: absoluteUrl("/contact"), name: `Contact ${SITE.name}`, about: orgRef },
          breadcrumbLd([{ name: "Contact", path: "/contact" }]),
        ]}
      />
      <Suspense fallback={<div className="w-full px-4 py-12 sm:px-6 lg:px-8 2xl:px-10">Loading...</div>}>
        <PublicContactScreen />
      </Suspense>
    </>
  )
}
