import type { Metadata } from "next"

import { JsonLd, faqLd, organizationLd, websiteLd } from "@/lib/seo/json-ld"
import { pageMetadata } from "@/lib/seo/metadata"
import { FAQS, SITE } from "@/lib/seo/site"
import { LandingPageScreen } from "@/lib/ui/screens/public/landing"

/** The questions the home page shows, so the FAQ markup matches what visitors see. */
const HOME_FAQ_QUESTIONS = [
  "How much do courses cost?",
  "How are classes delivered?",
  "Do you offer career support?",
  "Can I get a refund if I change my mind?",
]

export const metadata: Metadata = {
  ...pageMetadata({
    title: `${SITE.name}: ${SITE.headline}`,
    description: SITE.shortDescription,
    path: "/",
  }),
  // The home page uses the full title, without the "| TechOn Skills" suffix.
  title: { absolute: `${SITE.name}: ${SITE.headline}` },
}

export default function PublicHomePage() {
  const faqs = FAQS.filter((f) => HOME_FAQ_QUESTIONS.includes(f.question))
  return (
    <>
      <JsonLd data={[organizationLd(), websiteLd(), ...(faqs.length ? [faqLd(faqs)] : [])]} />
      <LandingPageScreen />
    </>
  )
}
