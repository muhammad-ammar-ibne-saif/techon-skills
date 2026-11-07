import { FAQS } from "@/utils/constants/faqs"
import { SITE_PHONE_DISPLAY } from "@/utils/constants/site-contact"

/** One place for the facts search engines and AI assistants should know about TechOn Skills. */
export const SITE = {
  name: "TechOn Skills",
  shortName: "TechOn",
  legalName: "Cloudrika Technologies",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://techonskills.com").replace(/\/+$/, ""),
  tagline: "AI-Powered Learning. Real Projects. Real Jobs.",
  /** The phrase after the name in the home page and default titles. */
  headline: "AI-Powered IT & Coding Courses in Lahore",
  description:
    "TechOn Skills is an AI-powered, project-based tech institute in Lahore, Pakistan. Learn web development, mobile app development, software engineering and e-commerce in live online classes, then get hired with AI mock interviews, an AI resume builder, verifiable certificates and career support.",
  shortDescription: "AI-powered tech courses in Lahore: web, mobile, software engineering and e-commerce, live online, with AI mock interviews, resume help and career support.",
  keywords: [
    "TechOn Skills",
    "AI-powered courses Pakistan",
    "AI-powered learning platform",
    "AI mock interview practice",
    "AI resume builder for students",
    "IT courses in Lahore",
    "web development course Pakistan",
    "software engineering course Lahore",
    "mobile app development course",
    "MERN stack course",
    "React course Pakistan",
    "Shopify course",
    "WordPress course",
    "e-commerce course Lahore",
    "online coding classes Pakistan",
    "affordable programming course",
    "tech institute Lahore",
  ],
  locale: "en_PK",
  language: "en-PK",
  email: "info@techonskills.com",
  phone: SITE_PHONE_DISPLAY,
  phoneE164: "+923257720992",
  address: {
    streetAddress: "8th Floor, Office No. 812, Al Hafeez Executive Towers, Gulberg II, Firdous Market",
    addressLocality: "Lahore",
    addressRegion: "Punjab",
    addressCountry: "PK",
  },
  brandColor: "#3B3BF5",
  logoPath: "/icons/icon-512.png",
} as const

export const absoluteUrl = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`

export { FAQS }

/** Paths that must never appear in search results. */
export const PRIVATE_PATHS = ["/admin", "/student", "/employer", "/auth", "/api"] as const

/** Trim text to a search-snippet length on a word boundary. */
export function snippet(text: string | null | undefined, max = 158): string {
  const clean = (text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`
}
