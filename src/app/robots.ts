import type { MetadataRoute } from "next"

import { PRIVATE_PATHS, SITE } from "@/lib/seo/site"

/**
 * Public pages are open to search engines and to AI assistants (so they can answer questions
 * about our courses and cite us). Dashboards, sign-in links and the API are closed to all.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "meta-externalagent",
]

export default function robots(): MetadataRoute.Robots {
  const disallow = [...PRIVATE_PATHS.map((p) => `${p}/`), "/*?*token="]
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_CRAWLERS, allow: ["/", "/llms.txt"], disallow },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
