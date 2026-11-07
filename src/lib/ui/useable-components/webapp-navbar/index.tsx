"use client"

import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { cn } from "@/lib/helpers"
import { Button } from "@/lib/ui/useable-components/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/lib/ui/useable-components/sheet"
import { COMPANY_NAME, NAV_ITEMS } from "@/utils/constants"
import { SheetContentSide } from "@/utils/enums"
import { ThemeSwitcher } from "@/lib/ui/useable-components/theme-switcher"
import { BrandMark } from "@/lib/ui/useable-components/brand-logo"
import { ContinueToDashboardDialog } from "@/lib/ui/useable-components/continue-dashboard-dialog"

export const WebappNavbar = ({ className }: { className?: string }) => {

  return (
    <header
      className={cn(
        "border-border/60 supports-backdrop-filter:bg-background/60 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur",
        className
      )}
    >
      <div className="flex h-16 w-full min-w-0 items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8 2xl:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                shape="pill"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={SheetContentSide.LEFT}
              className="flex h-full w-[min(18rem,85vw)] flex-col gap-0 p-0"
            >
              <SheetHeader className="border-border shrink-0 border-b p-4">
                <SheetTitle className="flex items-center gap-2">
                  <BrandMark className="size-15" title={COMPANY_NAME} />
                  <span className="truncate">{COMPANY_NAME}</span>
                </SheetTitle>
              </SheetHeader>

              <nav className="min-h-0 flex-1 overflow-y-auto p-2">
                <div className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => (
                    <SheetClose key={item.href} asChild>
                      <Button
                        asChild
                        variant="ghost"
                        shape="lg"
                        className="justify-start"
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    </SheetClose>
                  ))}
                </div>
              </nav>
              <div className="border-border mt-auto shrink-0 border-t p-4 lg:hidden">
                <div className="text-muted-foreground mb-2 text-xs font-medium">Theme</div>
                <ThemeSwitcher />
              </div>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="hover:bg-(--brand-secondary)/10 flex min-w-0 items-center gap-2 rounded-xl px-2 py-2 transition-colors"
            aria-label={`${COMPANY_NAME} home`}
          >
            <BrandMark className="size-13" title={COMPANY_NAME} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">{COMPANY_NAME}</div>
              <div className="text-muted-foreground truncate text-xs">
                Learn. Build. Grow.
              </div>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Button key={item.href} asChild variant="ghost" shape="pill">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeSwitcher className="hidden sm:inline-flex" />
          <ContinueToDashboardDialog className="text-xs sm:text-sm" />
        </div>
      </div>
    </header>
  )
}

