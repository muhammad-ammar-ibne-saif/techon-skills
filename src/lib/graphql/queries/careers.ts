import { gql } from "@apollo/client";
import { JOB_FIELDS } from "./jobs";

export const JOB_FIT_FIELDS = `
    fit {
        matched
        missing
        total
        courses { id title slug teaches enrolled }
    }
`;

export const PRACTICE_FIELDS = `
    id
    jobId
    jobTitle
    companyName
    source
    answeredCount
    averageScore
    aiAvailable
    feedbackLeftToday
    createdAt
    updatedAt
    questions { question focus answer score feedback tip feedbackSource answeredAt }
`;

export const INTERVIEW_FIELDS = `
    id
    companyName
    companyLogo
    job { id title companyName }
    student { id fullName profilePicture portfolioSlug }
    applicationId
    startAt
    durationMinutes
    mode
    location
    meetingUrl
    note
    status
    studentNote
    cancelReason
    createdAt
`;

export const CANDIDATE_FIELDS = `
    id
    fullName
    profilePicture
    headline
    location
    portfolioSlug
    skills
    projects { title tech }
    projectCount
    courses
    certificates
    isAlumni
    shortlisted
    shortlistNote
    invitedJobIds
    updatedAt
`;

export const PLACEMENT_FIELDS = `
    id
    student { id fullName email portfolioSlug }
    companyName
    jobTitle
    jobType
    startDate
    courses
    source
    verified
    note
    createdAt
`;

export const GET_RECOMMENDED_JOBS = gql`
    query GetRecommendedJobs($limit: Int) {
        recommendedJobs(limit: $limit) {
            ${JOB_FIELDS}
            fit { matched missing total }
        }
    }
`;

export const GET_MY_JOB_ALERT_SETTINGS = gql`
    query GetMyJobAlertSettings {
        myJobAlertSettings { jobAlerts jobAlertsEmail openToWork }
    }
`;

export const GET_MY_INTERVIEW_PRACTICES = gql`
    query GetMyInterviewPractices {
        myInterviewPractices { ${PRACTICE_FIELDS} }
    }
`;

export const GET_INTERVIEW_PRACTICE = gql`
    query GetInterviewPractice($id: ID!) {
        interviewPractice(id: $id) { ${PRACTICE_FIELDS} }
    }
`;

export const GET_MY_JOB_INVITES = gql`
    query GetMyJobInvites {
        myJobInvites {
            id
            companyName
            message
            createdAt
            job { id title companyName companyLogo status myApplication { id status } }
        }
    }
`;

export const GET_MY_INTERVIEWS = gql`
    query GetMyInterviews {
        myInterviews { ${INTERVIEW_FIELDS} }
    }
`;

export const GET_COMPANY_INTERVIEWS = gql`
    query GetCompanyInterviews {
        companyInterviews {
            ${INTERVIEW_FIELDS}
            suggestedSkills
            feedback { id authorName mine overall recommendation skills { skill score } strengths concerns createdAt updatedAt }
        }
    }
`;

export const GET_CANDIDATES = gql`
    query GetCandidates($filter: CandidateFilter, $page: Int, $limit: Int) {
        candidates(filter: $filter, page: $page, limit: $limit) {
            total
            items { ${CANDIDATE_FIELDS} }
        }
    }
`;

export const GET_MY_SHORTLIST = gql`
    query GetMyShortlist {
        myShortlist { note createdAt candidate { ${CANDIDATE_FIELDS} } }
    }
`;

export const GET_MY_PLACEMENTS = gql`
    query GetMyPlacements {
        myPlacements { ${PLACEMENT_FIELDS} }
    }
`;

export const GET_PLACEMENTS = gql`
    query GetPlacements($verified: Boolean, $search: String) {
        placements(verified: $verified, search: $search) { ${PLACEMENT_FIELDS} }
    }
`;

export const GET_PLACEMENT_STATS = gql`
    query GetPlacementStats($from: String, $to: String) {
        placementStats(from: $from, to: $to) {
            graduates
            placedGraduates
            rate
            totalPlacements
            unverified
            byCourse { courseId title graduates placed rate }
            topCompanies
        }
    }
`;

export const GET_PUBLIC_PLACEMENT_STATS = gql`
    query GetPublicPlacementStats {
        publicPlacementStats { graduates placed rate companies }
    }
`;

export const GET_MY_ALUMNI_STATUS = gql`
    query GetMyAlumniStatus {
        myAlumniStatus { isAlumni since }
    }
`;

export const GET_MY_ALUMNI_JOBS = gql`
    query GetMyAlumniJobs {
        myAlumniJobs { ${JOB_FIELDS} applicationsCount reviewNote }
    }
`;
