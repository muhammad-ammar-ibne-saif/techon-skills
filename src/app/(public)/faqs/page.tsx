import Link from "next/link"

import { cn } from "@/lib/helpers"
import { FaqList } from "@/lib/ui/screens/public/landing"
import { PageIntro, siteButton, siteContainer } from "@/lib/ui/useable-components/site-chrome/ui"
import { CONFIG, SITE_PHONE_DISPLAY, SITE_WHATSAPP_URL } from "@/utils/constants"
import { FAQS } from "@/utils/constants/faqs"

export default function FAQsPage() {
  return (
    <div className="w-full">
      <PageIntro
        label="// faq"
        title="Questions, answered."
        description={
          <>
            Everything you need to know before you enroll. Can&apos;t find your answer? Message us on WhatsApp at{" "}
            <a href={SITE_WHATSAPP_URL} className="text-foreground font-medium underline underline-offset-4">
              {SITE_PHONE_DISPLAY}
            </a>
            .
          </>
        }
      />
      <section className="py-14 sm:py-20">
        <div className={cn(siteContainer, "max-w-3xl!")}>
          <FaqList items={FAQS} />
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href={CONFIG.ROUTES.PUBLIC.ENROLLMENT} className={siteButton.primary}>
              Start enrollment
            </Link>
            <Link href={CONFIG.ROUTES.PUBLIC.CONTACT} className={siteButton.outline}>
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
