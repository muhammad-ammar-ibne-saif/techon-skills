import { gql } from "@apollo/client";
import { RESUME_FIELDS } from "../queries/resume";

export const SAVE_RESUME = gql`
    mutation SaveResume($id: ID, $input: ResumeInput!) {
        saveResume(id: $id, input: $input) { ${RESUME_FIELDS} }
    }
`;

export const SET_RESUME_PDF = gql`
    mutation SetResumePdf($id: ID!, $pdfUrl: String!) {
        setResumePdf(id: $id, pdfUrl: $pdfUrl) { id pdfUrl }
    }
`;

export const RESET_RESUME_FROM_PORTFOLIO = gql`
    mutation ResetResumeFromPortfolio {
        resetResumeFromPortfolio { ${RESUME_FIELDS} }
    }
`;

export const TAILOR_RESUME_FOR_JOB = gql`
    mutation TailorResumeForJob($jobId: ID!, $refresh: Boolean) {
        tailorResumeForJob(jobId: $jobId, refresh: $refresh) { ${RESUME_FIELDS} }
    }
`;
