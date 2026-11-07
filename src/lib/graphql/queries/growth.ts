import { gql } from "@apollo/client";
import { APPLICATION_FIELDS } from "./jobs";

export const CAREER_PATH_FIELDS = `
    id
    title
    slug
    description
    steps { skill why }
    isPublished
    sortOrder
    createdAt
`;

export const LEARNING_PATH_FIELDS = `
    done
    total
    nextSkill
    path { ${CAREER_PATH_FIELDS} }
    steps {
        skill
        why
        have
        openJobs
        courses { id title slug teaches enrolled }
        lessons { id title courseId courseTitle kind }
    }
`;

export const SPONSORED_PROJECT_FIELDS = `
    id
    title
    brief
    deliverables
    skills
    courseIds
    courses
    deadline
    status
    reviewNote
    companyName
    companyLogo
    companySlug
    submissionsCount
    acceptingWork
    approvedAt
    createdAt
`;

export const SUBMISSION_FIELDS = `
    id
    repoUrl
    demoUrl
    note
    status
    feedback
    reviewedAt
    addedToPortfolio
    createdAt
    updatedAt
`;

export const INTERVIEW_FEEDBACK_FIELDS = `
    id
    authorName
    mine
    overall
    recommendation
    skills { skill score }
    strengths
    concerns
    createdAt
    updatedAt
`;

export const GET_CAREER_PATHS = gql`
    query GetCareerPaths($includeDrafts: Boolean) {
        careerPaths(includeDrafts: $includeDrafts) { ${CAREER_PATH_FIELDS} studentsCount }
    }
`;

export const GET_MY_LEARNING_PATH = gql`
    query GetMyLearningPath {
        myLearningPath { ${LEARNING_PATH_FIELDS} }
    }
`;

export const GET_SKILL_DEMAND = gql`
    query GetSkillDemand($title: String!) {
        skillDemand(title: $title) { skill jobs }
    }
`;

export const GET_COMPANY_APPLICATIONS = gql`
    query GetCompanyApplications($jobId: ID) {
        companyApplications(jobId: $jobId) {
            ${APPLICATION_FIELDS}
            notesCount
            job { id title }
            student { id fullName email phoneNumber profilePicture portfolioSlug }
        }
    }
`;

export const GET_APPLICATION_NOTES = gql`
    query GetApplicationNotes($applicationId: ID!) {
        applicationNotes(applicationId: $applicationId) { id text authorName mine createdAt }
    }
`;

export const GET_INTERVIEW_SKILL_REPORT = gql`
    query GetInterviewSkillReport($from: String, $to: String) {
        interviewSkillReport(from: $from, to: $to) {
            feedbackCount
            averageOverall
            recommendations { strongYes yes no strongNo }
            skills { skill average count lowCount }
            byCourse { courseId title feedbackCount averageOverall weakSkills { skill average count lowCount } }
        }
    }
`;

export const GET_OPEN_SPONSORED_PROJECTS = gql`
    query GetOpenSponsoredProjects {
        openSponsoredProjects { ${SPONSORED_PROJECT_FIELDS} mySubmission { ${SUBMISSION_FIELDS} } }
    }
`;

export const GET_SPONSORED_PROJECT = gql`
    query GetSponsoredProject($id: ID!) {
        sponsoredProject(id: $id) { ${SPONSORED_PROJECT_FIELDS} mySubmission { ${SUBMISSION_FIELDS} } }
    }
`;

export const GET_MY_PROJECT_SUBMISSIONS = gql`
    query GetMyProjectSubmissions {
        mySubmissions { ${SUBMISSION_FIELDS} project { id title companyName companyLogo status deadline } }
    }
`;

export const GET_MY_COMPANY_PROJECTS = gql`
    query GetMyCompanyProjects {
        myCompanyProjects { ${SPONSORED_PROJECT_FIELDS} }
    }
`;

export const GET_PROJECT_SUBMISSIONS = gql`
    query GetProjectSubmissions($projectId: ID!) {
        projectSubmissions(projectId: $projectId) {
            ${SUBMISSION_FIELDS}
            student { id fullName profilePicture portfolioSlug }
        }
    }
`;

export const GET_ADMIN_SPONSORED_PROJECTS = gql`
    query GetAdminSponsoredProjects($status: SponsoredProjectStatus) {
        adminSponsoredProjects(status: $status) { ${SPONSORED_PROJECT_FIELDS} }
    }
`;

export const GET_FUNNEL_REPORT = gql`
    query GetFunnelReport($from: String, $to: String) {
        funnelReport(from: $from, to: $to) {
            from
            to
            stages { key label count rateFromPrevious }
            enquiriesThatApplied
            lostLeads
            rejectedApplications
            byCourse { courseId title applications enrolled graduates hired }
            daily { day visits enquiries applications }
        }
    }
`;

export const GET_AT_RISK_FOLLOW_UPS = gql`
    query GetAtRiskFollowUps($userId: ID!, $courseId: ID!) {
        atRiskFollowUps(userId: $userId, courseId: $courseId) { id note byName snoozeUntil createdAt }
    }
`;

export const GET_COURSE_FEEDBACK_SUMMARY = gql`
    query GetCourseFeedbackSummary($courseId: ID!) {
        courseFeedbackSummary(courseId: $courseId) {
            courseId
            courseTitle
            ratings
            average
            modules { contentId title sortOrder ratings average distribution needsAttention comments { rating comment createdAt } }
        }
    }
`;

/** Just ids and titles, for course pickers. */
export const GET_COURSE_OPTIONS = gql`
    query GetCourseOptions {
        getCourses { id title slug }
    }
`;
