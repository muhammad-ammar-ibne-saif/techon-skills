import { gql } from "@apollo/client";

export const COMPANY_PUBLIC_FIELDS = `
    id
    name
    slug
    logo
    website
    about
    industry
    size
    city
    isPartner
    openJobsCount
    linkedin
    facebook
    instagram
    twitter
    careersProvider
`;

export const COMPANY_MANAGE_FIELDS = `
    ${COMPANY_PUBLIC_FIELDS}
    status
    contactName
    contactEmail
    contactPhone
    reviewNote
    careersHandle
    careersSyncedAt
    careersSyncResult
    members { id fullName email }
    createdAt
`;

export const JOB_FIELDS = `
    id
    source
    companyName
    companyLogo
    fromPartner
    title
    description
    location
    workMode
    jobType
    experience
    salaryMin
    salaryMax
    salaryCurrency
    skills
    applyMode
    applyUrl
    status
    deadline
    postedAt
    feedSource
    company { id name slug logo isPartner }
`;

export const APPLICATION_FIELDS = `
    id
    coverNote
    portfolioUrl
    cvUrl
    tailoredCv
    projects { title url reason }
    status
    statusChangedAt
    createdAt
`;

export const GET_JOBS = gql`
    query GetJobs($filter: JobFilter, $page: Int, $limit: Int) {
        jobs(filter: $filter, page: $page, limit: $limit) {
            total
            items { ${JOB_FIELDS} }
        }
    }
`;

export const GET_JOB = gql`
    query GetJob($id: ID!) {
        job(id: $id) {
            ${JOB_FIELDS}
            myApplication { id status createdAt }
        }
    }
`;

export const GET_PARTNER_COMPANIES = gql`
    query GetPartnerCompanies {
        partnerCompanies { ${COMPANY_PUBLIC_FIELDS} }
    }
`;

export const GET_COMPANY_BY_SLUG = gql`
    query GetCompanyBySlug($slug: String!) {
        companyBySlug(slug: $slug) { ${COMPANY_PUBLIC_FIELDS} }
    }
`;

export const GET_MY_COMPANY = gql`
    query GetMyCompany {
        myCompany { ${COMPANY_MANAGE_FIELDS} }
    }
`;

export const GET_MY_COMPANY_JOBS = gql`
    query GetMyCompanyJobs {
        myCompanyJobs { ${JOB_FIELDS} applicationsCount }
    }
`;

export const GET_JOB_APPLICATIONS = gql`
    query GetJobApplications($jobId: ID!) {
        jobApplications(jobId: $jobId) {
            ${APPLICATION_FIELDS}
            student { id fullName email phoneNumber profilePicture portfolioSlug }
        }
    }
`;

export const GET_MY_JOB_APPLICATIONS = gql`
    query GetMyJobApplications {
        myJobApplications {
            ${APPLICATION_FIELDS}
            job { id title companyName companyLogo status company { slug } }
        }
    }
`;

export const GET_ADMIN_COMPANIES = gql`
    query GetAdminCompanies($status: CompanyStatus) {
        adminCompanies(status: $status) { ${COMPANY_MANAGE_FIELDS} }
    }
`;

export const GET_ADMIN_JOBS = gql`
    query GetAdminJobs($source: JobSource, $status: JobStatus, $search: String) {
        adminJobs(source: $source, status: $status, search: $search) { ${JOB_FIELDS} applicationsCount }
    }
`;

export const GET_ADMIN_JOB_APPLICATIONS = gql`
    query GetAdminJobApplications {
        adminJobApplications {
            ${APPLICATION_FIELDS}
            job { id title companyName }
            student { id fullName email phoneNumber profilePicture portfolioSlug }
        }
    }
`;

export const GET_JOB_FEED_SETTINGS = gql`
    query GetJobFeedSettings {
        jobFeedSettings { remotive arbeitnow remoteok keywords lastRunAt lastResult }
    }
`;
