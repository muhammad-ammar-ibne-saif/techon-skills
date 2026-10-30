import { ReactNode } from "react"

import { SiteFooter, SiteHeader } from "@/lib/ui/useable-components/site-chrome"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-svh min-w-0 flex-col overflow-x-clip">
      <SiteHeader />
      <main className="site-main min-w-0 w-full flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
