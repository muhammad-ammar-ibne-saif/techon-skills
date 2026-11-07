import type { Metadata } from "next"

import { pageMetadata } from "@/lib/seo/metadata"
import { SimpleLegalPage } from "@/lib/ui/screens/public/legal/simple-legal-page"

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How TechOn Skills (Cloudrika Technologies) collects, uses and protects the personal data of students, applicants and visitors, and how to ask for access or deletion.",
  path: "/privacy-policy",
})

export default function PrivacyPolicyPage() {
  return (
    <SimpleLegalPage
      title="Privacy Policy"
      content={[
        "Last updated: August 1,2026",

        "TechOn Skills (operated by Cloudrika Technologies) respects your privacy. This policy explains what we collect and how we use it.",

        "1. Information We Collect",
        "Enrollment data: name, phone number, email, country/city, selected course(s), and payment screenshot.",
        "Account/dashboard data: login credentials, assignment submissions, marks, and progress records.",
        "Communication data: messages sent via the Contact form, WhatsApp, phone, or email.",
        "Usage data: pages visited, device/browser type, and general analytics (e.g. via Google Analytics or similar tools).",

        "2. How We Use Your Information",
        "To create and manage your enrollment and dashboard account.",
        "To verify payment and activate course access.",
        "To deliver course materials, track marks, and provide feedback.",
        "To contact you about your course, schedule changes, or (with consent) new offers.",
        "To evaluate performance for career-support introductions, where applicable.",

        "3. Payment Screenshots",
        "Payment proof screenshots are used solely to verify fee payment and are stored securely; they are not shared outside the TechOn Skills/Cloudrika admin team.",

        "4. Sharing of Information",
        "We do not sell your personal data. We may share limited information with payment/banking partners solely to verify transactions, with potential employers/clients for career-support introductions (only with your explicit consent at the time), and with service providers who help operate the platform (e.g. hosting, dashboard infrastructure), under confidentiality obligations.",

        "5. Data Retention",
        "We retain enrollment and academic records for as long as needed for certificates and career-support history, or as required by applicable record-keeping obligations.",

        "6. Your Rights",
        "You may request access to, correction of, or deletion of your personal data by emailing info@techonskills.com, subject to records we're required to keep (e.g. payment records) for legal or accounting purposes.",

        "7. Security",
        "We take reasonable technical and organizational measures to protect your data, but no online platform can guarantee absolute security.",

        "8. Children's Privacy",
        "If you are under 18, a parent or guardian should review this policy and our Terms of Service with you before enrollment.",

        "9. Changes to This Policy",
        "We may update this Privacy Policy from time to time. Continued use of the platform after changes means you accept the updated policy.",

        "10. Contact",
        "Email: info@techonskills.com · Phone: +92 325 7720992 · Address: 8th Floor, Office No. 812, Al Hafeez Executive Towers, Gulberg II, Firdous Market, Lahore, Punjab, Pakistan.",
      ]}
    />
  )
}