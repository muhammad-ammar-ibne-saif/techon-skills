import { getSeoCourses } from "@/lib/seo/server-api"
import { FAQS, SITE, absoluteUrl, snippet } from "@/lib/seo/site"

/**
 * /llms.txt: a plain-Markdown summary of the institute for AI assistants (llmstxt.org), so
 * ChatGPT, Claude, Perplexity and others answer questions about us with correct facts and links.
 */
export const revalidate = 3600

const money = (cur: string, n: number) => `${cur} ${n.toLocaleString("en-US")}`

export async function GET() {
  const courses = await getSeoCourses()

  const courseLines = courses.map((c) => {
    const cur = c.currency || "PKR"
    const fee = c.isFree
      ? "free"
      : `${money(cur, c.feePerMonth)} a month for ${c.courseDurationInMonths} months (${money(cur, c.totalFee)} total)`
    const about = snippet(c.heroDescription || c.subtitle || c.subDescription, 220)
    return `- [${c.title}](${absoluteUrl(`/courses/${c.slug}`)}): ${fee}.${about ? ` ${about}` : ""}`
  })

  const a = SITE.address
  const body = `# ${SITE.name}

> ${SITE.description}

## Key facts

- Name: ${SITE.name} (operated by ${SITE.legalName})
- Location: ${a.streetAddress}, ${a.addressLocality}, ${a.addressRegion}, Pakistan
- Delivery: live online classes on Google Meet, with recordings, materials, assignments and graded projects on a student dashboard
- Certificates: issued on completion, each with a QR code anyone can verify at ${absoluteUrl("/certificates/verify")}/<code>
- AI tools: AI mock interviews with feedback on each answer, AI-tailored resumes and AI cover notes for job applications
- Careers: job board, public student portfolios and employer hiring
- Contact: ${SITE.email}, ${SITE.phoneE164}
- Website: ${SITE.url}

## Courses

${courseLines.join("\n")}

## Pages

- [All courses](${absoluteUrl("/courses")}): every course with fees, duration and syllabus
- [Enrollment](${absoluteUrl("/enrollment")}): how to enrol and pay
- [Jobs](${absoluteUrl("/jobs")}): open tech jobs and internships in Pakistan
- [Hire our students](${absoluteUrl("/hire")}): for employers
- [Articles](${absoluteUrl("/articles")}): guides on learning to code and tech careers
- [About](${absoluteUrl("/about")})
- [FAQs](${absoluteUrl("/faqs")})
- [Contact](${absoluteUrl("/contact")})
- [Refund policy](${absoluteUrl("/refund-policy")})

## Frequently asked questions

${FAQS.map((f) => `### ${f.question}\n\n${f.answer}`).join("\n\n")}
`

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  })
}
