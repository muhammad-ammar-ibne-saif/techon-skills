import type { Metadata } from "next"

import { pageMetadata } from "@/lib/seo/metadata"
import { SimpleLegalPage } from "@/lib/ui/screens/public/legal/simple-legal-page"

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms for enrolling in and using TechOn Skills courses and the student dashboard: eligibility, fees, course delivery, conduct, intellectual property and governing law.",
  path: "/terms-of-service",
})

export default function TermsOfServicePage() {
  return (
    <SimpleLegalPage
      title="Terms of Service"
      content={[
        "Last updated: August 1,2026",

        "These Terms of Service (\"Terms\") govern your use of the TechOn Skills platform (techonskills.com), operated by Cloudrika Technologies (\"TechOn Skills,\" \"we,\" \"us,\" \"our\"), based in Lahore, Punjab, Pakistan. By enrolling in or using any TechOn Skills course, you agree to these Terms.",

        "1. Eligibility",
        "You must be at least 16 years old to enroll. Enrollment by a minor requires consent and registration by a parent or guardian.",

        "2. Enrollment and Account",
        "Enrollment requires selecting a course, submitting the required first-fee payment proof, and receiving admin approval. You are responsible for the accuracy of the information you submit and for keeping your dashboard login secure.",

        "3. Course Access and Delivery",
        "Courses are delivered through structured lessons, live sessions, assignments, and a marks/feedback system, as described on each course page. TechOn Skills may update course content, schedules, or instructors to maintain training quality, and will make reasonable efforts to notify enrolled students of material changes.",

        "4. Fees and Payment",
        "Fees are as listed on the course or enrollment page at the time of your enrollment, and are due as per the schedule shown at enrollment (e.g. monthly). Non-payment may result in suspension of dashboard access until dues are cleared.",

        "5. Career Support Disclaimer",
        "Career support (introductions, guidance, referrals) is offered on a best-effort basis to students who demonstrate consistent performance and strong project submissions. TechOn Skills does not guarantee employment, freelance income, client acquisition, or any specific financial outcome as a result of any course.",

        "6. Student Conduct",
        "Students agree not to share dashboard access or course materials outside their own use, harass instructors or other students, submit plagiarized assignments, or misuse WhatsApp community groups for spam or unrelated promotion. Violations may result in suspension or removal without refund.",

        "7. Intellectual Property",
        "All course content, videos, lesson materials, and platform design are the property of Cloudrika Technologies / TechOn Skills. Students may use materials for personal learning only and may not redistribute, resell, or publicly republish course content.",

        "8. Limitation of Liability",
        "TechOn Skills provides training on an \"as-is\" basis. To the maximum extent permitted by Pakistani law, TechOn Skills is not liable for indirect, incidental, or consequential damages arising from use of the platform, including reliance on career-support outcomes.",

        "9. Termination",
        "TechOn Skills may suspend or terminate access for Terms violations, non-payment, or misuse. Students may discontinue at any time, subject to the Refund Policy.",

        "10. Governing Law",
        "These Terms are governed by the laws of the Islamic Republic of Pakistan. Disputes fall under the jurisdiction of the courts of Lahore, Punjab.",

        "11. Contact",
        "Email: info@techonskills.com · Phone: +92 325 7720992 · Address: 8th Floor, Office No. 812, Al Hafeez Executive Towers, Gulberg II, Firdous Market, Lahore, Punjab, Pakistan.",
      ]}
    />
  )
}