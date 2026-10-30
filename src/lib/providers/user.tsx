"use client";
import { IUser, IUserContextProvider, IUserProfileInfo, IEnrolledCourseFromApi } from "@/utils/interfaces";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_USER_PROFILE_INFO } from "@/lib/graphql";
import { LoggerLevel } from "@/utils/enums/logger";
import { logger } from "../helpers";
import { CONFIG } from "@/utils/constants";
import { usePathname } from "next/navigation";

const UserContext = createContext<IUserContextProvider | null>(null);

interface UserProfileQueryResult {
    userProfileInfo?: IUserProfileInfo & {
        enrolledCourses?: IEnrolledCourseFromApi[];
        requestedCourses?: IEnrolledCourseFromApi[];
    };
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [userData] = useState<IUser | null>(null);

    const pathname = usePathname();
    const { data, loading, error, refetch } = useQuery<UserProfileQueryResult>(GET_USER_PROFILE_INFO, {
        fetchPolicy: "network-only",
        skip: !pathname || pathname === CONFIG.ROUTES.AUTH.VERIFY_MAGIC_LINK,
    });

    const userProfileInfo = useMemo(() => {
        const raw = data?.userProfileInfo;
        if (!raw) return null;
        return {
            id: raw.id,
            email: raw.email,
            fullName: raw.fullName ?? null,
            phoneNumber: raw.phoneNumber ?? null,
            profilePicture: raw.profilePicture ?? null,
            role: raw.role,
            status: raw.status,
            allowedMarkGradesOn: raw.allowedMarkGradesOn ?? [],
        };
    }, [data?.userProfileInfo]);

    const enrolledCoursesFromApi = useMemo((): IEnrolledCourseFromApi[] => {
        return data?.userProfileInfo?.enrolledCourses ?? [];
    }, [data?.userProfileInfo?.enrolledCourses]);

    const requestedCoursesFromApi = useMemo((): IEnrolledCourseFromApi[] => {
        return data?.userProfileInfo?.requestedCourses ?? [];
    }, [data?.userProfileInfo?.requestedCourses]);

    /** True after first response; stays true during background refetches so route guards don't flash/spin on every navigation. */
    const profileLoaded = !loading || data !== undefined;

    const refetchProfile = useCallback(async () => {
        await refetch();
    }, [refetch]);

    useEffect(() => {
        if (userProfileInfo) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER.PROFILE, JSON.stringify(userProfileInfo));
        }
    }, [userProfileInfo]);

    useEffect(() => {
        if (error) {
            logger({ type: LoggerLevel.ERROR, message: JSON.stringify(error), showToast: true });
        }
    }, [error]);

    const value = useMemo(
        () => ({
            userProfileInfo: error ? null : userProfileInfo,
            userData,
            enrolledCoursesFromApi,
            requestedCoursesFromApi,
            profileLoaded,
            refetchProfile,
        }),
        [userProfileInfo, userData, enrolledCoursesFromApi, requestedCoursesFromApi, profileLoaded, error, refetchProfile]
    );

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within the UserProvider context");
    }
    return context;
}
