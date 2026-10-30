import { UserRole, UserStatus, SelectedCourse } from "@/utils/enums";

export interface IUserProfileInfo {
    id: string;
    email: string;
    fullName?: string | null;
    phoneNumber?: string | null;
    profilePicture?: string | null;
    role: UserRole;
    status: UserStatus;
    /** Course IDs this user can award marks in (Instructor/Admin). Empty or undefined for Super Admin means all. */
    allowedMarkGradesOn?: string[];
}

export interface IUser {
    _id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    isBlocked: boolean;
    isSuspended: boolean;
    isDeleted: boolean;
    fullName: string;
    phoneNumber: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    enrolledCourses: SelectedCourse[];
}

export interface IEnrolledCourseFromApi {
    id: string;
    title: string;
    slug: string;
}

export interface IUserContextProvider {
    userProfileInfo: IUserProfileInfo | null;
    userData: IUser | null;
    enrolledCoursesFromApi: IEnrolledCourseFromApi[];
    requestedCoursesFromApi: IEnrolledCourseFromApi[];
    profileLoaded: boolean;
    refetchProfile: () => Promise<void>;
}