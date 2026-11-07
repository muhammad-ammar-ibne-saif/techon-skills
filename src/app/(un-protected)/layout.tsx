import type { Metadata } from "next"

import { NOINDEX } from "@/lib/seo/metadata"

/** Sign-in links and password set-up pages: never indexed. */
export const metadata: Metadata = NOINDEX

export default function UnprotectedLayout({ children }: { children: React.ReactNode }) {
  return children
}
