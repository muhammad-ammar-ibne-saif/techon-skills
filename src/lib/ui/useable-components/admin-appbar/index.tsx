"use client"

import Image from "next/image"
import Link from "next/link"
import {
    ChevronDownIcon,
    LogOutIcon,
    SettingsIcon,
} from "lucide-react"

import {
    cn,
    getImageSrc,
    getPostLoginHomePath,
    getStaffPanelLabel,
    isBackendImageUrl,
    isInstructorRole,
    logger,
} from "@/lib/helpers"
import { Button } from "@/lib/ui/useable-components/button"
import { Separator } from "@/lib/ui/useable-components/separator"
import { COMPANY_NAME, CONFIG } from "@/utils/constants"
import { SidebarTrigger } from "@/lib/ui/useable-components/sidebar"
import { ThemeSwitcher } from "@/lib/ui/useable-components/theme-switcher"
import { NotificationsDropdown } from "@/lib/ui/useable-components/notifications-dropdown"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { apiService } from "@/lib/services"
import { toast } from "react-hot-toast"
import { LoggerLevel } from "@/utils/enums"
import { BrandMark } from "@/lib/ui/useable-components/brand-logo"
import { useUser } from "@/lib/providers/user"

export const AdminAppbar = ({ className }: { className?: string }) => {
    const router = useRouter()
    const { userProfileInfo } = useUser()
    const role = userProfileInfo?.role
    const isInstructor = isInstructorRole(role)
    const homeHref = getPostLoginHomePath(role)
    const panelLabel = getStaffPanelLabel(role)
    const displayName =
        userProfileInfo?.fullName?.trim() ||
        userProfileInfo?.email ||
        (isInstructor ? "Instructor" : "Admin")
    const displaySub = userProfileInfo?.email || COMPANY_NAME
    const avatarSrc = getImageSrc(userProfileInfo?.profilePicture)

    const handleLogout = useCallback(async () => {
        try {
            const response = await apiService.logout()
            if (response.success) {
                Object.values(CONFIG.STORAGE_KEYS.AUTH).forEach((key) => localStorage.removeItem(key))
                localStorage.removeItem(CONFIG.STORAGE_KEYS.USER.PROFILE)
                router.replace(CONFIG.ROUTES.PUBLIC.HOME)
            }
        } catch (error) {
            logger({ type: LoggerLevel.ERROR, message: JSON.stringify(error) })
            toast.error("Failed to logout")
        }
    }, [router])
    return (
        <header
            className={cn(
                "border-border/60 supports-backdrop-filter:bg-background/60 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur",
                className
            )}
        >
            <div className="flex h-14 w-full items-center gap-3 px-4 sm:px-6 lg:px-8 2xl:px-10">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="md:hidden">
                        <SidebarTrigger aria-label="Open navigation" />
                    </div>

                    <Link
                        href={homeHref}
                        className="hover:bg-(--brand-secondary)/10 flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                        aria-label={`${COMPANY_NAME} ${panelLabel.toLowerCase()} home`}
                    >
                        <BrandMark className="size-7" title={COMPANY_NAME} />
                        <div className="min-w-0 leading-tight">
                            <div className="truncate text-sm font-semibold">{COMPANY_NAME}</div>
                            <div className="text-muted-foreground truncate text-xs">
                                {panelLabel}
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <NotificationsDropdown />
                    <ThemeSwitcher className="hidden sm:inline-flex" />
                    <DialogPrimitive.Root>
                        <DialogPrimitive.Trigger asChild>
                            <Button
                                variant="ghost"
                                shape="pill"
                                className="h-10 gap-2 px-2"
                                aria-label="Open profile menu"
                            >
                                <span className="bg-(--brand-primary) text-(--text-on-dark) inline-flex size-8 items-center justify-center overflow-hidden rounded-full">
                                    {avatarSrc ? (
                                        <Image
                                            src={avatarSrc}
                                            alt=""
                                            width={32}
                                            height={32}
                                            className="size-8 object-cover"
                                            unoptimized={isBackendImageUrl(avatarSrc)}
                                        />
                                    ) : (
                                        <BrandMark className="size-5" />
                                    )}
                                </span>
                                <span className="hidden max-w-40 truncate text-sm font-medium sm:block">
                                    {displayName}
                                </span>
                                <ChevronDownIcon className="text-muted-foreground hidden size-4 sm:block" />
                            </Button>
                        </DialogPrimitive.Trigger>

                        <DialogPrimitive.Portal>
                            <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/20" />
                            <DialogPrimitive.Content
                                className={cn(
                                    "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed right-4 top-[3.75rem] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-lg outline-none"
                                )}
                            >
                                <DialogPrimitive.Title className="sr-only">
                                    Account menu
                                </DialogPrimitive.Title>
                                <DialogPrimitive.Description className="sr-only">
                                    {panelLabel} account menu and logout
                                </DialogPrimitive.Description>
                                <div className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-(--brand-primary) text-(--text-on-dark) flex size-10 items-center justify-center overflow-hidden rounded-full">
                                            {avatarSrc ? (
                                                <Image
                                                    src={avatarSrc}
                                                    alt=""
                                                    width={40}
                                                    height={40}
                                                    className="size-10 object-cover"
                                                    unoptimized={isBackendImageUrl(avatarSrc)}
                                                />
                                            ) : (
                                                <BrandMark className="size-6" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold">{displayName}</div>
                                            <div className="text-muted-foreground truncate text-xs">
                                                {displaySub}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="p-2">
                                    {!isInstructor && (
                                        <DialogPrimitive.Close asChild>
                                            <Button asChild variant="ghost" shape="lg" className="w-full justify-start">
                                                <Link href={CONFIG.ROUTES.ADMIN.SETTINGS}>
                                                    <SettingsIcon className="size-4 text-muted-foreground" />
                                                    <span>Settings</span>
                                                </Link>
                                            </Button>
                                        </DialogPrimitive.Close>
                                    )}

                                    <DialogPrimitive.Close asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            shape="lg"
                                            className="w-full justify-start text-red-600 hover:text-red-700"
                                            onClick={handleLogout}
                                        >
                                            <LogOutIcon className="size-4" />
                                            <span>Logout</span>
                                        </Button>
                                    </DialogPrimitive.Close>
                                </div>
                            </DialogPrimitive.Content>
                        </DialogPrimitive.Portal>
                    </DialogPrimitive.Root>
                </div>
            </div>
        </header>
    )
}
