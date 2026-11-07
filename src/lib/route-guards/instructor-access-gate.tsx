"use client";

import { useUser } from "@/lib/providers/user";
import { CONFIG } from "@/utils/constants";
import { UserRole } from "@/utils/enums/user";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

/** Admin routes instructors may access (grading, assignments, lectures for their courses). */
export const INSTRUCTOR_ALLOWED_ADMIN_PATHS = [
  CONFIG.ROUTES.ADMIN.SUBMISSIONS,
  CONFIG.ROUTES.ADMIN.ASSIGNMENTS,
  CONFIG.ROUTES.ADMIN.QUIZZES,
  CONFIG.ROUTES.ADMIN.STUDENT_PROGRESS,
  CONFIG.ROUTES.ADMIN.AT_RISK,
  CONFIG.ROUTES.ADMIN.SCHEDULE_LECTURES,
  CONFIG.ROUTES.ADMIN.COURSE_CONTENT,
  CONFIG.ROUTES.ADMIN.ATTENDANCE,
  CONFIG.ROUTES.ADMIN.RECORDINGS,
  CONFIG.ROUTES.ADMIN.QUESTIONS,
  CONFIG.ROUTES.ADMIN.BATCHES,
] as const;

function normalizePath(path: string | null): string {
  if (!path) return "";
  return path.split("?")[0]?.replace(/\/$/, "") ?? "";
}

function isInstructorAllowedPath(path: string): boolean {
  return INSTRUCTOR_ALLOWED_ADMIN_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`)
  );
}

/**
 * Restricts instructors to grading/assignment/lecture admin screens only.
 * Admins and super-admins pass through unchanged.
 */
export function InstructorAccessGate({ children }: { children: ReactNode }) {
  const { userProfileInfo, profileLoaded } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const path = normalizePath(pathname);

  useEffect(() => {
    if (!profileLoaded) return;
    if (userProfileInfo?.role !== UserRole.INSTRUCTOR) return;

    if (!isInstructorAllowedPath(path)) {
      router.replace(CONFIG.ROUTES.ADMIN.SUBMISSIONS);
    }
  }, [profileLoaded, userProfileInfo?.role, path, router]);

  if (!profileLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--brand-primary) border-t-transparent" />
      </div>
    );
  }

  if (userProfileInfo?.role === UserRole.INSTRUCTOR && !isInstructorAllowedPath(path)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--brand-primary) border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
