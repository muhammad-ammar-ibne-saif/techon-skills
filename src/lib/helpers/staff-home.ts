import { CONFIG } from "@/utils/constants"
import { UserRole } from "@/utils/enums/user"

/** Landing path after login for each role. */
export function getPostLoginHomePath(role?: UserRole | string | null): string {
  if (role === UserRole.INSTRUCTOR) return CONFIG.ROUTES.ADMIN.SUBMISSIONS
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) return CONFIG.ROUTES.ADMIN.DASHBOARD
  if (role === UserRole.STUDENT) return CONFIG.ROUTES.STUDENT.DASHBOARD
  if (role === UserRole.EMPLOYER) return CONFIG.ROUTES.EMPLOYER.DASHBOARD
  return CONFIG.ROUTES.PUBLIC.HOME
}

export function getStaffPanelLabel(role?: UserRole | string | null): string {
  return role === UserRole.INSTRUCTOR ? "Instructor panel" : "Admin panel"
}

export function getStaffEyebrow(role?: UserRole | string | null): string {
  return role === UserRole.INSTRUCTOR ? "Instructor" : "Admin"
}

export function isInstructorRole(role?: UserRole | string | null): boolean {
  return role === UserRole.INSTRUCTOR
}
