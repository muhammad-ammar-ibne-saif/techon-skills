"use client";

import { useUser } from "@/lib/providers/user";
import { CONFIG } from "@/utils/constants";
import { UserRole } from "@/utils/enums/user";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { StudentLayout } from "@/lib/layouts";
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

export function StudentRouteGuard({ children }: { children: ReactNode }) {
  const { userProfileInfo, profileLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!profileLoaded) return;

    const role = userProfileInfo?.role;

    if (!userProfileInfo) {
      router.replace(CONFIG.ROUTES.PUBLIC.HOME);
      return;
    }

    if (role && ADMIN_ROLES.includes(role)) {
      router.replace(CONFIG.ROUTES.ADMIN.DASHBOARD);
      return;
    }

    if (role && role !== UserRole.STUDENT) {
      if (role === UserRole.INSTRUCTOR) {
        router.replace(CONFIG.ROUTES.ADMIN.SUBMISSIONS);
        return;
      }
      if (role === UserRole.EMPLOYER) {
        router.replace(CONFIG.ROUTES.EMPLOYER.DASHBOARD);
        return;
      }
      router.replace(CONFIG.ROUTES.PUBLIC.HOME);
    }
  }, [profileLoaded, userProfileInfo, router]);

  if (!profileLoaded) {
    return (
      <StudentLayout>
        <ContentAreaLoader />
      </StudentLayout>
    );
  }

  const role = userProfileInfo?.role;
  if (
    !userProfileInfo ||
    (role && ADMIN_ROLES.includes(role)) ||
    (role && role !== UserRole.STUDENT)
  ) {
    return (
      <StudentLayout>
        <ContentAreaLoader />
      </StudentLayout>
    );
  }

  return <>{children}</>;
}
