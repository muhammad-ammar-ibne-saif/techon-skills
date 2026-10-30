import { StudentAppbar, StudentFooter, StudentSidebar, SidebarInset, SidebarProvider } from "@/lib/ui/useable-components"
import { ReactNode } from "react"
import { ProfileCompletionAlert } from "@/lib/ui/useable-components/profile-completion-alert"

export const StudentLayout = ({ children }: { children: ReactNode }) => {
    const containerClass =
        "w-full px-4 sm:px-6 lg:px-8 2xl:px-10"

    return (
        <SidebarProvider defaultOpen={false}>
            <StudentSidebar />
            <SidebarInset className="bg-surface min-h-svh">
                <StudentAppbar />
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className={`${containerClass} min-w-0 flex-1 py-6`}>
                        <ProfileCompletionAlert />
                        {children}
                    </div>
                    <StudentFooter className="mt-auto" />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}