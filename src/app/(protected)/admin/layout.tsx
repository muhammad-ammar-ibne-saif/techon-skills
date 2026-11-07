import type { Metadata } from "next"

import { AdminLayout } from "@/lib/layouts";
import { AdminRouteGuard, InstructorAccessGate } from "@/lib/route-guards";

import { NOINDEX } from "@/lib/seo/metadata"

export const metadata: Metadata = NOINDEX

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminLayout>
            <AdminRouteGuard>
                <InstructorAccessGate>{children}</InstructorAccessGate>
            </AdminRouteGuard>
        </AdminLayout>
    )
}