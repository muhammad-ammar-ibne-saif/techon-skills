import { CalendarIcon, FileTextIcon, LogsIcon, NewspaperIcon, SettingsIcon, TicketIcon, UsersIcon, LayoutDashboardIcon, UserPlusIcon, InboxIcon, ImageIcon, BookOpenIcon, BanknoteIcon, ClipboardCheckIcon, NotebookPenIcon, VideoIcon, ClipboardListIcon, TrendingUpIcon, ScrollTextIcon, FolderOpenIcon, UserCheckIcon, PlaySquareIcon, WalletIcon, ArchiveIcon, UsersRoundIcon, MessageCircleQuestionIcon, TicketPercentIcon, MegaphoneIcon, BriefcaseIcon, TriangleAlertIcon, ChartColumnIcon, PartyPopperIcon, FilterIcon, StarIcon, MapIcon, LightbulbIcon, GaugeIcon } from "lucide-react"
import { CONFIG } from "./config"
import { UserRole } from "@/utils/enums/user"

const ALL_STAFF = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INSTRUCTOR] as const
const ADMIN_ONLY = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const
const INSTRUCTOR_STAFF = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INSTRUCTOR] as const

export const ADMIN_SIDEBAR_ITEMS = [
    { label: "Dashboard", href: CONFIG.ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboardIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Registration requests", href: CONFIG.ROUTES.ADMIN.REGISTRATION_REQUESTS, icon: UserPlusIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Enrollment requests", href: CONFIG.ROUTES.ADMIN.ENROLLMENT_REQUESTS, icon: BookOpenIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Contact submissions", href: CONFIG.ROUTES.ADMIN.CONTACT_SUBMISSIONS, icon: InboxIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Users", href: CONFIG.ROUTES.ADMIN.USERS, icon: UsersIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "User bin", href: CONFIG.ROUTES.ADMIN.USER_BIN, icon: ArchiveIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Tickets", href: CONFIG.ROUTES.ADMIN.TICKETS, icon: TicketIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "News", href: CONFIG.ROUTES.ADMIN.NEWS, icon: NewspaperIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Articles", href: CONFIG.ROUTES.ADMIN.ARTICLES, icon: FileTextIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Logs", href: CONFIG.ROUTES.ADMIN.LOGS, icon: LogsIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Settings", href: CONFIG.ROUTES.ADMIN.SETTINGS, icon: SettingsIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Events", href: CONFIG.ROUTES.ADMIN.EVENTS, icon: CalendarIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Courses", href: CONFIG.ROUTES.ADMIN.COURSES, icon: TicketIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Payments", href: CONFIG.ROUTES.ADMIN.PAYMENTS, icon: BanknoteIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Coupons & referrals", href: CONFIG.ROUTES.ADMIN.OFFERS, icon: TicketPercentIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Popup & deals", href: CONFIG.ROUTES.ADMIN.PROMOTIONS, icon: MegaphoneIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Companies & jobs", href: CONFIG.ROUTES.ADMIN.JOBS, icon: BriefcaseIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Placements & alumni", href: CONFIG.ROUTES.ADMIN.PLACEMENTS, icon: PartyPopperIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Sponsored projects", href: CONFIG.ROUTES.ADMIN.PROJECTS, icon: LightbulbIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Career paths", href: CONFIG.ROUTES.ADMIN.CAREER_PATHS, icon: MapIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Funnel", href: CONFIG.ROUTES.ADMIN.FUNNEL, icon: FilterIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Finance", href: CONFIG.ROUTES.ADMIN.FINANCE, icon: WalletIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Reports", href: CONFIG.ROUTES.ADMIN.REPORTS, icon: ChartColumnIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Grade Submissions", href: CONFIG.ROUTES.ADMIN.SUBMISSIONS, icon: ClipboardCheckIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Course assignments", href: CONFIG.ROUTES.ADMIN.ASSIGNMENTS, icon: NotebookPenIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Course content", href: CONFIG.ROUTES.ADMIN.COURSE_CONTENT, icon: FolderOpenIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Course quizzes", href: CONFIG.ROUTES.ADMIN.QUIZZES, icon: ClipboardListIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Student progress", href: CONFIG.ROUTES.ADMIN.STUDENT_PROGRESS, icon: TrendingUpIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Students to follow up", href: CONFIG.ROUTES.ADMIN.AT_RISK, icon: TriangleAlertIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Module ratings", href: CONFIG.ROUTES.ADMIN.COURSE_FEEDBACK, icon: StarIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Interview skills", href: CONFIG.ROUTES.ADMIN.INTERVIEW_SKILLS, icon: GaugeIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Certificates", href: CONFIG.ROUTES.ADMIN.CERTIFICATES, icon: ScrollTextIcon, disabled: false, roles: ADMIN_ONLY },
    { label: "Schedule lectures", href: CONFIG.ROUTES.ADMIN.SCHEDULE_LECTURES, icon: VideoIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Batches", href: CONFIG.ROUTES.ADMIN.BATCHES, icon: UsersRoundIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Lecture recordings", href: CONFIG.ROUTES.ADMIN.RECORDINGS, icon: PlaySquareIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Student questions", href: CONFIG.ROUTES.ADMIN.QUESTIONS, icon: MessageCircleQuestionIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Attendance", href: CONFIG.ROUTES.ADMIN.ATTENDANCE, icon: UserCheckIcon, disabled: false, roles: INSTRUCTOR_STAFF },
    { label: "Uploaded images", href: CONFIG.ROUTES.ADMIN.IMAGES, icon: ImageIcon, disabled: false, roles: ADMIN_ONLY },
] as const

export type AdminSidebarItem = (typeof ADMIN_SIDEBAR_ITEMS)[number]

/** Sidebar entries visible for the given role. */
export function getAdminSidebarItemsForRole(role: UserRole | undefined) {
    if (!role) return []
    return ADMIN_SIDEBAR_ITEMS.filter((item) => (item.roles as readonly UserRole[]).includes(role))
}

export { ALL_STAFF }
