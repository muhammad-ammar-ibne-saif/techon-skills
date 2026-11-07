import Link from "next/link"
import {
    ArrowRightIcon,
    CalendarDaysIcon,
    SearchIcon,
    SparklesIcon,
} from "lucide-react"
import { cn } from "@/lib/helpers"
import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import { Separator } from "@/lib/ui/useable-components/separator"
import { COMPANY_NAME, STUDENT_COURSES_QUICK_LINKS } from "@/utils/constants"
import { BrandMark } from "@/lib/ui/useable-components/brand-logo"
import { IStudentCoursesHeaderProps } from "@/utils/interfaces"

export const StudentCoursesHeader = ({ className, searchProps }: IStudentCoursesHeaderProps) => {


    return (
        <section
            className={cn(
                "relative w-full overflow-hidden rounded-3xl border bg-background/60 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/50 sm:p-10",
                className
            )}
        >
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-24 left-1/2 h-72 w-3xl -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(79,195,232,0.28),transparent_60%)] blur-2xl" />
                <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(242,140,40,0.22),transparent_65%)] blur-2xl" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-size-[48px_48px] opacity-[0.25] mask-[radial-gradient(ellipse_at_center,black_45%,transparent_70%)]" />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-(--brand-primary) text-(--text-on-dark) flex size-10 items-center justify-center overflow-hidden rounded-2xl">
                        <BrandMark className="size-6" title={COMPANY_NAME} />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{COMPANY_NAME}</div>
                        <div className="text-muted-foreground truncate text-xs">
                            Learning hub
                        </div>
                    </div>
                </div>

                {!!STUDENT_COURSES_QUICK_LINKS?.length && (
                    <div className="flex flex-wrap items-center gap-2">
                        {STUDENT_COURSES_QUICK_LINKS.map((item) => (
                            <Button
                                key={item.href}
                                asChild
                                variant="ghost"
                                size="sm"
                                shape="pill"
                                className={cn(item.disabled && "pointer-events-none opacity-60")}
                                aria-disabled={item.disabled}
                            >
                                <Link href={item.href}>{item.label}</Link>
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div className="space-y-5">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-secondary shadow-xs">
                        <SparklesIcon className="size-3.5 text-(--brand-highlight)" />
                        Your next breakthrough starts here
                    </div>

                    <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                        Courses
                    </h1>

                    <p className="text-muted-foreground max-w-2xl text-pretty text-base leading-7">
                        Browse courses, track assignments, stay updated with news & events, and keep your profile in sync — all in one clean, focused workspace.
                    </p>

                    {STUDENT_COURSES_QUICK_LINKS?.length && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {STUDENT_COURSES_QUICK_LINKS.map((item) => (
                                <Button
                                    key={item.href}
                                    asChild
                                    variant="outline"
                                    size="lg"
                                    shape="pill"
                                    className="sm:w-auto"
                                >
                                    <Link href={item.href}>
                                        <CalendarDaysIcon className="size-4" />
                                        {item.label}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    )}

                    <form className="mt-2 flex flex-col gap-3 sm:flex-row">
                        <div className="relative w-full">
                            <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                            <Input
                                placeholder="Search…"
                                className="h-11 rounded-full pl-10"
                                {...searchProps}
                            />
                        </div>
                    </form>
                </div>

                <Card className="bg-background/70 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/55">
                    <CardContent className="space-y-6">
                        <div className="space-y-1">
                            <div className="text-sm font-semibold">Quick wins</div>
                            <div className="text-muted-foreground text-sm">
                                Jump back in with the essentials in one place.
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-2xl border bg-background/70 p-4">
                                <div className="text-2xl font-semibold">120+</div>
                                <div className="text-muted-foreground text-xs">Lessons</div>
                            </div>
                            <div className="rounded-2xl border bg-background/70 p-4">
                                <div className="text-2xl font-semibold">24/7</div>
                                <div className="text-muted-foreground text-xs">Support</div>
                            </div>
                            <div className="rounded-2xl border bg-background/70 p-4">
                                <div className="text-2xl font-semibold">New</div>
                                <div className="text-muted-foreground text-xs">Updates</div>
                            </div>
                        </div>

                        <Separator />

                        {!!STUDENT_COURSES_QUICK_LINKS?.length && (
                            <div className="flex flex-col gap-3">
                                {STUDENT_COURSES_QUICK_LINKS.slice(0, 2).map((l) => (
                                    <Button
                                        key={l.href}
                                        asChild
                                        variant="ghost"
                                        shape="pill"
                                        className="justify-between"
                                    >
                                        <Link href={l.href}>
                                            {l.label}
                                            <ArrowRightIcon className="size-4 text-muted-foreground" />
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}