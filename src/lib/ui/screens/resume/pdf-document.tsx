import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { ResumePdfData } from "./shared"

const ACCENT = "#1f4e79"

const s = StyleSheet.create({
  page: { paddingVertical: 36, paddingHorizontal: 42, fontSize: 10, fontFamily: "Helvetica", color: "#222", lineHeight: 1.35 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "center", lineHeight: 1.2 },
  headline: { fontSize: 11, textAlign: "center", marginTop: 4, color: "#444" },
  contact: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 6, fontSize: 9 },
  contactItem: { marginHorizontal: 5, color: "#333" },
  link: { color: ACCENT, textDecoration: "none" },
  section: { marginTop: 12 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    borderBottomWidth: 0.8,
    borderBottomColor: ACCENT,
    paddingBottom: 2,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: "#555", fontSize: 9 },
  item: { marginBottom: 6 },
  links: { flexDirection: "row", fontSize: 9 },
  linkGap: { marginLeft: 8 },
  tech: { fontSize: 8.5, color: "#555", fontFamily: "Helvetica-Oblique", marginTop: 1 },
})

const short = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "")
const dates = (a: string, b: string) => [a, b].filter(Boolean).join(" – ")

/** A one-page-style CV. Every link is clickable in the PDF. */
export function ResumePdfDocument({ data: r }: { data: ResumePdfData }) {
  const contact: { text: string; href?: string }[] = [
    r.email ? { text: r.email, href: `mailto:${r.email}` } : null,
    r.phone ? { text: r.phone } : null,
    r.location ? { text: r.location } : null,
    r.portfolioUrl ? { text: `Portfolio: ${short(r.portfolioUrl)}`, href: r.portfolioUrl } : null,
    ...r.links.map((l) => ({ text: l.label || short(l.url), href: l.url })),
  ].filter((x): x is { text: string; href?: string } => Boolean(x))

  return (
    <Document title={`${r.fullName || "CV"} – CV`} author={r.fullName} creator="TechOn Skills">
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{r.fullName || "Your name"}</Text>
        {r.headline ? <Text style={s.headline}>{r.headline}</Text> : null}
        {contact.length > 0 && (
          <View style={s.contact}>
            {contact.map((c, i) =>
              c.href ? (
                <Link key={i} src={c.href} style={[s.contactItem, s.link]}>
                  {c.text}
                </Link>
              ) : (
                <Text key={i} style={s.contactItem}>
                  {c.text}
                </Text>
              )
            )}
          </View>
        )}

        {r.summary ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Summary</Text>
            <Text>{r.summary}</Text>
          </View>
        ) : null}

        {r.skills.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Skills</Text>
            <Text>{r.skills.join(" · ")}</Text>
          </View>
        )}

        {r.projects.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Projects</Text>
            {r.projects.map((p, i) => (
              <View key={i} style={s.item} wrap={false}>
                <View style={s.row}>
                  <Text style={s.bold}>{p.title}</Text>
                  <View style={s.links}>
                    {p.url ? (
                      <Link src={p.url} style={s.link}>
                        Live
                      </Link>
                    ) : null}
                    {p.repoUrl ? (
                      <Link src={p.repoUrl} style={[s.link, s.linkGap]}>
                        Code
                      </Link>
                    ) : null}
                    {p.portfolioLink && r.portfolioUrl ? (
                      <Link src={p.portfolioLink} style={[s.link, s.linkGap]}>
                        Portfolio
                      </Link>
                    ) : null}
                  </View>
                </View>
                {p.description ? <Text>{p.description}</Text> : null}
                {p.tech.length > 0 && <Text style={s.tech}>{p.tech.join(", ")}</Text>}
              </View>
            ))}
          </View>
        )}

        {r.experience.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Experience</Text>
            {r.experience.map((x, i) => (
              <View key={i} style={s.item} wrap={false}>
                <View style={s.row}>
                  <Text>
                    <Text style={s.bold}>{x.role}</Text>
                    {x.company ? `, ${x.company}` : ""}
                  </Text>
                  <Text style={s.muted}>{dates(x.start, x.end)}</Text>
                </View>
                {x.description ? <Text>{x.description}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {r.education.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Education</Text>
            {r.education.map((x, i) => (
              <View key={i} style={[s.row, s.item]} wrap={false}>
                <Text>
                  <Text style={s.bold}>{x.degree}</Text>
                  {x.school ? `, ${x.school}` : ""}
                </Text>
                <Text style={s.muted}>{dates(x.start, x.end)}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
