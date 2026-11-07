import type { Metadata } from "next"

import { StudentLayout } from "@/lib/layouts";
import { StudentApprovalGate, StudentFeeGate, StudentRouteGuard } from "@/lib/route-guards";

import { NOINDEX } from "@/lib/seo/metadata"

export const metadata: Metadata = NOINDEX

export default function StudentRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <StudentRouteGuard>
            <StudentApprovalGate>
                <StudentFeeGate>
                    <StudentLayout>{children}</StudentLayout>
                </StudentFeeGate>
            </StudentApprovalGate>
        </StudentRouteGuard>
    )
}