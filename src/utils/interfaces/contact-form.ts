import { IContactFormCourse } from "./courses";

export interface IContactForm {
    name: string;
    email: string;
    message?: string;
    courses: IContactFormCourse[];
    phone: string;
    /** Base64 data URL of fee payment screenshot (legacy; prefer enrollment-application API). */
    feePaymentScreenshotDataUrl?: string;
}

export type LeadStatus = "NEW" | "CALLED" | "INTERESTED" | "ENROLLED" | "LOST";

export interface ILeadNote {
    text: string;
    byName: string;
    at: string;
}

export interface IContactFormSubmission {
    _id: string;
    name: string;
    email: string;
    phone: string;
    message?: string;
    courses: IContactFormCourse[];
    createdAt: string;
    leadStatus?: LeadStatus;
    statusChangedAt?: string | null;
    followUpAt?: string | null;
    notes?: ILeadNote[];
}

