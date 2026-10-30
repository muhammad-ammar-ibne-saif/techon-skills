import { cn } from "@/lib/helpers"
import { SectionLabel, siteContainer, siteDotGrid } from "@/lib/ui/useable-components/site-chrome/ui"

/** Lines like "3. No-Show / Non-Attendance" are section headings; "Last updated: …" is shown as a meta line. */
const HEADING = /^\d+\.\s/
const UPDATED = /^last updated:/i

export const SimpleLegalPage = ({ title, content }: { title: string; content: string[] }) => {
  const updated = content.find((p) => UPDATED.test(p))
  const body = content.filter((p) => p !== updated)

  return (
    <div className="w-full">
      <section className={cn("border-border/60 border-b", siteDotGrid)}>
        <div className={cn(siteContainer, "py-14 sm:py-20")}>
          <SectionLabel>{`// legal${updated ? ` · ${updated.toLowerCase()}` : ""}`}</SectionLabel>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-[3.25rem]">{title}</h1>
        </div>
      </section>
      <div className={cn(siteContainer, "max-w-3xl! py-12 sm:py-16")}>
        <div className="space-y-4 text-[15px] leading-7">
          {body.map((p) =>
            HEADING.test(p) ? (
              <h2 key={p} className="pt-6 text-lg font-semibold tracking-tight first:pt-0">
                <span className="mr-2 font-mono text-sm text-(--site-accent)">{p.match(HEADING)![0].trim()}</span>
                {p.replace(HEADING, "")}
              </h2>
            ) : (
              <p key={p} className="text-foreground/85">
                {p}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  )
}
