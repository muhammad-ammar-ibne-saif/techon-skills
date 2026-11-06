import { BookIcon, BookOpenIcon, CalendarIcon, CreditCardIcon, FileTextIcon, FolderOpenIcon, HeadphonesIcon, LayoutDashboardIcon, ListTodoIcon, MegaphoneIcon, SettingsIcon, UserIcon, AwardIcon, ClipboardListIcon, ScrollTextIcon, UserCheckIcon, PlaySquareIcon, GiftIcon } from "lucide-react"
import { CONFIG } from "./config"

const STUDENT_ROUTES = CONFIG.ROUTES.STUDENT;

export const STUDENT_SIDEBAR_ITEMS = [
    { label: "My Dashboard", href: STUDENT_ROUTES.DASHBOARD, icon: LayoutDashboardIcon, disabled: false },
    { label: "My Enrolled Courses", href: STUDENT_ROUTES.MY_ENROLLED_COURSES, icon: BookOpenIcon, disabled: false },
    { label: "Courses", href: STUDENT_ROUTES.COURSES, icon: BookIcon, disabled: false },
    { label: "Course content", href: STUDENT_ROUTES.COURSE_CONTENT, icon: FolderOpenIcon, disabled: false },
    { label: "Recordings", href: STUDENT_ROUTES.RECORDINGS, icon: PlaySquareIcon, disabled: false },
    { label: "Attendance", href: STUDENT_ROUTES.ATTENDANCE, icon: UserCheckIcon, disabled: false },
    { label: "Announcements", href: STUDENT_ROUTES.ANNOUNCEMENTS, icon: MegaphoneIcon, disabled: false },
    { label: "My Assignments", href: STUDENT_ROUTES.ASSIGNMENTS, icon: ListTodoIcon, disabled: false },
    { label: "My Quizzes", href: STUDENT_ROUTES.QUIZZES, icon: ClipboardListIcon, disabled: false },
    { label: "My Marks", href: STUDENT_ROUTES.MARKS, icon: AwardIcon, disabled: false },
    { label: "My Certificates", href: STUDENT_ROUTES.CERTIFICATES, icon: ScrollTextIcon, disabled: false },
    { label: "Fees", href: STUDENT_ROUTES.FEES, icon: CreditCardIcon, disabled: false },
    { label: "Refer a friend", href: STUDENT_ROUTES.REFER, icon: GiftIcon, disabled: false },
    { label: "Events", href: STUDENT_ROUTES.EVENTS, icon: CalendarIcon, disabled: false },
    { label: "Articles", href: STUDENT_ROUTES.ARTICLES, icon: FileTextIcon, disabled: false },
    { label: "Support", href: STUDENT_ROUTES.SUPPORT, icon: HeadphonesIcon, disabled: false },
    { label: "Profile", href: STUDENT_ROUTES.PROFILE, icon: UserIcon, disabled: false },
    { label: "Settings", href: STUDENT_ROUTES.SETTINGS, icon: SettingsIcon, disabled: false },
]