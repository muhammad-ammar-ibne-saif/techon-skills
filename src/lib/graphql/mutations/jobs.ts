import { gql } from "@apollo/client";
import { APPLICATION_FIELDS, COMPANY_MANAGE_FIELDS, JOB_FIELDS } from "../queries/jobs";

export const UPDATE_MY_COMPANY = gql`
    mutation UpdateMyCompany($input: CompanyInput!) {
        updateMyCompany(input: $input) { ${COMPANY_MANAGE_FIELDS} }
    }
`;

export const SYNC_COMPANY_JOBS = gql`
    mutation SyncCompanyJobs($companyId: ID) {
        syncCompanyJobs(companyId: $companyId) { ${COMPANY_MANAGE_FIELDS} }
    }
`;

export const CREATE_JOB = gql`
    mutation CreateJob($input: JobInput!) {
        createJob(input: $input) { ${JOB_FIELDS} applicationsCount }
    }
`;

export const UPDATE_JOB = gql`
    mutation UpdateJob($id: ID!, $input: JobInput!) {
        updateJob(id: $id, input: $input) { ${JOB_FIELDS} applicationsCount }
    }
`;

export const SET_JOB_STATUS = gql`
    mutation SetJobStatus($id: ID!, $status: JobStatus!) {
        setJobStatus(id: $id, status: $status) { id status }
    }
`;

export const DELETE_JOB = gql`
    mutation DeleteJob($id: ID!) {
        deleteJob(id: $id)
    }
`;

export const APPLY_TO_JOB = gql`
    mutation ApplyToJob($jobId: ID!, $coverNote: String, $resumeId: ID) {
        applyToJob(jobId: $jobId, coverNote: $coverNote, resumeId: $resumeId) { ${APPLICATION_FIELDS} }
    }
`;

export const SET_APPLICATION_STATUS = gql`
    mutation SetApplicationStatus($id: ID!, $status: ApplicationStatus!) {
        setApplicationStatus(id: $id, status: $status) { id status statusChangedAt }
    }
`;

export const REVIEW_COMPANY = gql`
    mutation ReviewCompany($id: ID!, $approve: Boolean!, $note: String) {
        reviewCompany(id: $id, approve: $approve, note: $note) { ${COMPANY_MANAGE_FIELDS} }
    }
`;

export const SET_COMPANY_PARTNER = gql`
    mutation SetCompanyPartner($id: ID!, $isPartner: Boolean!) {
        setCompanyPartner(id: $id, isPartner: $isPartner) { id isPartner }
    }
`;

export const ADMIN_CREATE_COMPANY = gql`
    mutation AdminCreateCompany($input: CompanyInput!, $isPartner: Boolean) {
        adminCreateCompany(input: $input, isPartner: $isPartner) { ${COMPANY_MANAGE_FIELDS} }
    }
`;

export const ADMIN_UPDATE_COMPANY = gql`
    mutation AdminUpdateCompany($id: ID!, $input: CompanyInput!) {
        adminUpdateCompany(id: $id, input: $input) { ${COMPANY_MANAGE_FIELDS} }
    }
`;

export const INVITE_COMPANY_MEMBER = gql`
    mutation InviteCompanyMember($companyId: ID!, $email: String!, $fullName: String) {
        inviteCompanyMember(companyId: $companyId, email: $email, fullName: $fullName) { ${COMPANY_MANAGE_FIELDS} }
    }
`;

export const UPDATE_JOB_FEED_SETTINGS = gql`
    mutation UpdateJobFeedSettings($input: JobFeedSettingsInput!) {
        updateJobFeedSettings(input: $input) { remotive arbeitnow remoteok keywords lastRunAt lastResult }
    }
`;

export const RUN_JOB_FEED_IMPORT = gql`
    mutation RunJobFeedImport {
        runJobFeedImport { remotive arbeitnow remoteok keywords lastRunAt lastResult }
    }
`;
