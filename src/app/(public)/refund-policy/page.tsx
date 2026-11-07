import type { Metadata } from "next"

import { pageMetadata } from "@/lib/seo/metadata"
import { SimpleLegalPage } from "@/lib/ui/screens/public/legal/simple-legal-page"

export const metadata: Metadata = pageMetadata({
  title: "Refund Policy",
  description:
    "TechOn Skills refunds: full refund up to 3 days before your course starts, 50% within the first 7 days, and how to request one by email or WhatsApp.",
  path: "/refund-policy",
})

export default function RefundPolicyPage() {
  return (
    <SimpleLegalPage
      title="Refund Policy"
      content={[
        "Last updated: August 1,2026",

        "1. Before Course Start",
        "If you cancel your enrollment at least 3 days before your course's official start date, you are eligible for a full refund of your first fee payment, minus any payment-processing charges.",

        "2. After Course Start",
        "Within the first 7 days of the course starting, a 50% refund is available if you decide the course isn't the right fit. After this window, fees are non-refundable, since access to lesson materials, live sessions, and instructor time has already been provided.",

        "3. No-Show / Non-Attendance",
        "Non-attendance of live classes does not entitle a student to a refund, as recordings and materials remain accessible on the dashboard for the enrolled period.",

        "4. Course Cancellation by TechOn Skills",
        "If TechOn Skills cancels a batch or course before it starts (for example, due to insufficient enrollment), enrolled students receive a full refund or, if preferred, a transfer of fees to another available course or batch.",

        "5. Outcome-Based Guarantees",
        "Any specific outcome guarantee (for example, 'first client in 60 days or refund') applies only to cohorts where this guarantee is explicitly stated on that course or offer page at the time of enrollment, and only when the student has completed all listed conditions (attendance percentage, assignment submission, etc.) stated on that specific offer. This general Refund Policy does not itself create such a guarantee.",

        "6. How to Request a Refund",
        "Email info@techonskills.com or WhatsApp +92 325 7720992 with your enrollment details and reason for the request. Approved refunds are processed within 7–10 business days to the original payment method or account provided.",

        "7. Non-Refundable Items",
        "Any registration or processing fee charged separately from course fees is non-refundable in all cases.",
      ]}
    />
  )
}