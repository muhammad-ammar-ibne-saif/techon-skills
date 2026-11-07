import { ReactNode } from "react"

import { SiteFooter, SiteHeader } from "@/lib/ui/useable-components/site-chrome"
import { SitePopup } from "@/lib/ui/useable-components/site-popup"
import { VisitCounter } from "@/lib/ui/useable-components/visit-counter"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-svh min-w-0 flex-col overflow-x-clip">
      <SiteHeader />
      <main className="site-main min-w-0 w-full flex-1">{children}</main>
      <SiteFooter />
      <SitePopup />
      <VisitCounter />
    </div>
  )
}
