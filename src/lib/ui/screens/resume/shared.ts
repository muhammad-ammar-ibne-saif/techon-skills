import { apiService } from "@/lib/services"

export type ResumeMode = "VISUAL" | "LATEX"

export type ResumeLink = { label: string; url: string }
export type ResumeProject = {
  title: string
  description: string
  url: string
  repoUrl: string
  tech: string[]
  portfolioIndex: number | null
  portfolioLink: string
  reason: string
}
export type ResumeExperience = { role: string; company: string; start: string; end: string; description: string }
export type ResumeEducation = { school: string; degree: string; start: string; end: string }

export type Resume = {
  id: string
  kind: "BASE" | "TAILORED"
  jobId: string | null
  mode: ResumeMode
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string[]
  links: ResumeLink[]
  projects: ResumeProject[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
  showPortfolioLink: boolean
  portfolioUrl: string
  latex: string
  generatedLatex: string
  pdfUrl: string
  tailorSource: "AI" | "KEYWORDS" | null
  tailorNote: string
  outdated: boolean
  aiAvailable: boolean
  aiRunsLeftToday: number
  updatedAt: string
  job?: { id: string; title: string; companyName: string } | null
}

/** What the editor changes; projects keep their tech as text while typing. */
export type ResumeForm = Omit<
  Resume,
  "id" | "kind" | "jobId" | "portfolioUrl" | "generatedLatex" | "pdfUrl" | "tailorSource" | "tailorNote" | "outdated" | "aiAvailable" | "aiRunsLeftToday" | "updatedAt" | "job" | "projects" | "skills"
> & {
  skills: string
  projects: (Omit<ResumeProject, "tech"> & { tech: string })[]
}

export const blankProject = { title: "", description: "", url: "", repoUrl: "", tech: "", portfolioIndex: null, portfolioLink: "", reason: "" }
export const blankExperience: ResumeExperience = { role: "", company: "", start: "", end: "", description: "" }
export const blankEducation: ResumeEducation = { school: "", degree: "", start: "", end: "" }

const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)

/** Copy field by field: query results carry __typename, which the input types don't accept. */
export function formFrom(r: Resume): ResumeForm {
  return {
    mode: r.mode,
    fullName: r.fullName,
    headline: r.headline,
    email: r.email,
    phone: r.phone,
    location: r.location,
    summary: r.summary,
    skills: r.skills.join(", "),
    links: r.links.map((l) => ({ label: l.label, url: l.url })),
    projects: r.projects.map((p) => ({
      title: p.title,
      description: p.description,
      url: p.url,
      repoUrl: p.repoUrl,
      tech: p.tech.join(", "),
      portfolioIndex: p.portfolioIndex,
      portfolioLink: p.portfolioLink,
      reason: p.reason,
    })),
    experience: r.experience.map((x) => ({ role: x.role, company: x.company, start: x.start, end: x.end, description: x.description })),
    education: r.education.map((x) => ({ school: x.school, degree: x.degree, start: x.start, end: x.end })),
    showPortfolioLink: r.showPortfolioLink,
    latex: r.latex,
  }
}

export function inputFrom(f: ResumeForm) {
  return {
    mode: f.mode,
    fullName: f.fullName,
    headline: f.headline,
    email: f.email,
    phone: f.phone,
    location: f.location,
    summary: f.summary,
    skills: list(f.skills),
    links: f.links.filter((l) => l.url.trim()).map((l) => ({ label: l.label, url: l.url.trim() })),
    projects: f.projects
      .filter((p) => p.title.trim())
      .map((p) => ({
        title: p.title,
        description: p.description,
        url: p.url.trim(),
        repoUrl: p.repoUrl.trim(),
        tech: list(p.tech),
        portfolioIndex: p.portfolioIndex,
        reason: p.reason,
      })),
    experience: f.experience.filter((x) => x.role.trim() || x.company.trim()),
    education: f.education.filter((x) => x.school.trim() || x.degree.trim()),
    showPortfolioLink: f.showPortfolioLink,
    latex: f.latex,
  }
}

/** The data the PDF is drawn from. */
export type ResumePdfData = {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string[]
  links: ResumeLink[]
  projects: { title: string; description: string; url: string; repoUrl: string; tech: string[]; portfolioLink: string }[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
  portfolioUrl: string
}

export function pdfDataFrom(r: Resume | (ResumeForm & { portfolioUrl: string })): ResumePdfData {
  const form = "generatedLatex" in r ? formFrom(r) : r
  const input = inputFrom(form)
  const linkOf = new Map(form.projects.map((p) => [p.title, p.portfolioLink]))
  return {
    fullName: input.fullName,
    headline: input.headline,
    email: input.email,
    phone: input.phone,
    location: input.location,
    summary: input.summary,
    skills: input.skills,
    links: input.links,
    projects: input.projects.map((p) => ({ ...p, portfolioLink: linkOf.get(p.title) ?? "" })),
    experience: input.experience,
    education: input.education,
    portfolioUrl: form.showPortfolioLink ? r.portfolioUrl : "",
  }
}

/** Draw the PDF in the browser (the library loads only when needed). */
export async function buildResumePdf(data: ResumePdfData): Promise<Blob> {
  const [{ pdf }, { ResumePdfDocument }] = await Promise.all([import("@react-pdf/renderer"), import("./pdf-document")])
  return pdf(ResumePdfDocument({ data })).toBlob()
}

/** Store a PDF in the CV folder; returns its link. */
export async function uploadResumePdf(blob: Blob, name: string): Promise<string> {
  const safe = name.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-|-$/g, "") || "cv"
  const res = await apiService.uploadImage(new File([blob], `${safe}-cv.pdf`, { type: "application/pdf" }), "cvs")
  if (!res?.success || !res.data?.url) throw new Error(res?.message || "Couldn't upload the PDF")
  return res.data.url
}

export const MAX_PDF_BYTES = 5 * 1024 * 1024

/** Open LaTeX in Overleaf in a new tab (Overleaf's documented "open in Overleaf" form post). */
export function openInOverleaf(latex: string, name = "cv.tex") {
  const form = document.createElement("form")
  form.method = "POST"
  form.action = "https://www.overleaf.com/docs"
  form.target = "_blank"
  for (const [k, v] of [
    ["encoded_snip", encodeURIComponent(latex)],
    ["snip_name", name],
    ["engine", "pdflatex"],
  ]) {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = k
    input.value = v
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
  form.remove()
}

export function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/x-tex" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
