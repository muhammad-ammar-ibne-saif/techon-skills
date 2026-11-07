import { gql } from "@apollo/client";
import { CAREER_PATH_FIELDS, INTERVIEW_FEEDBACK_FIELDS, LEARNING_PATH_FIELDS, SPONSORED_PROJECT_FIELDS, SUBMISSION_FIELDS } from "../queries/growth";

export const SET_MY_TARGET_PATH = gql`
    mutation SetMyTargetPath($pathId: ID) {
        setMyTargetPath(pathId: $pathId) { ${LEARNING_PATH_FIELDS} }
    }
`;

export const CREATE_CAREER_PATH = gql`
    mutation CreateCareerPath($input: CareerPathInput!) {
        createCareerPath(input: $input) { ${CAREER_PATH_FIELDS} studentsCount }
    }
`;

export const UPDATE_CAREER_PATH = gql`
    mutation UpdateCareerPath($id: ID!, $input: CareerPathInput!) {
        updateCareerPath(id: $id, input: $input) { ${CAREER_PATH_FIELDS} studentsCount }
    }
`;

export const DELETE_CAREER_PATH = gql`
    mutation DeleteCareerPath($id: ID!) {
        deleteCareerPath(id: $id)
    }
`;

export const ADD_APPLICATION_NOTE = gql`
    mutation AddApplicationNote($applicationId: ID!, $text: String!) {
        addApplicationNote(applicationId: $applicationId, text: $text) { id text authorName mine createdAt }
    }
`;

export const DELETE_APPLICATION_NOTE = gql`
    mutation DeleteApplicationNote($id: ID!) {
        deleteApplicationNote(id: $id)
    }
`;

export const SUBMIT_INTERVIEW_FEEDBACK = gql`
    mutation SubmitInterviewFeedback($interviewId: ID!, $input: InterviewFeedbackInput!) {
        submitInterviewFeedback(interviewId: $interviewId, input: $input) { ${INTERVIEW_FEEDBACK_FIELDS} }
    }
`;

export const DELETE_INTERVIEW_FEEDBACK = gql`
    mutation DeleteInterviewFeedback($interviewId: ID!) {
        deleteInterviewFeedback(interviewId: $interviewId)
    }
`;

export const CREATE_SPONSORED_PROJECT = gql`
    mutation CreateSponsoredProject($input: SponsoredProjectInput!) {
        createSponsoredProject(input: $input) { ${SPONSORED_PROJECT_FIELDS} }
    }
`;

export const UPDATE_SPONSORED_PROJECT = gql`
    mutation UpdateSponsoredProject($id: ID!, $input: SponsoredProjectInput!) {
        updateSponsoredProject(id: $id, input: $input) { ${SPONSORED_PROJECT_FIELDS} }
    }
`;

export const CLOSE_SPONSORED_PROJECT = gql`
    mutation CloseSponsoredProject($id: ID!) {
        closeSponsoredProject(id: $id) { ${SPONSORED_PROJECT_FIELDS} }
    }
`;

export const REVIEW_SPONSORED_PROJECT = gql`
    mutation ReviewSponsoredProject($id: ID!, $approve: Boolean!, $note: String) {
        reviewSponsoredProject(id: $id, approve: $approve, note: $note) { ${SPONSORED_PROJECT_FIELDS} }
    }
`;

export const SUBMIT_PROJECT_WORK = gql`
    mutation SubmitProjectWork($projectId: ID!, $input: ProjectSubmissionInput!) {
        submitProjectWork(projectId: $projectId, input: $input) { ${SUBMISSION_FIELDS} }
    }
`;

export const WITHDRAW_PROJECT_WORK = gql`
    mutation WithdrawProjectWork($projectId: ID!) {
        withdrawProjectWork(projectId: $projectId)
    }
`;

export const REVIEW_PROJECT_SUBMISSION = gql`
    mutation ReviewProjectSubmission($id: ID!, $status: ProjectSubmissionStatus!, $feedback: String) {
        reviewProjectSubmission(id: $id, status: $status, feedback: $feedback) { ${SUBMISSION_FIELDS} }
    }
`;

export const ADD_SUBMISSION_TO_PORTFOLIO = gql`
    mutation AddSubmissionToPortfolio($id: ID!) {
        addSubmissionToPortfolio(id: $id) { ${SUBMISSION_FIELDS} }
    }
`;

export const RECORD_VISIT = gql`
    mutation RecordVisit {
        recordVisit
    }
`;

export const LOG_AT_RISK_FOLLOW_UP = gql`
    mutation LogAtRiskFollowUp($userId: ID!, $courseId: ID!, $note: String!, $snoozeDays: Int) {
        logAtRiskFollowUp(userId: $userId, courseId: $courseId, note: $note, snoozeDays: $snoozeDays) { id note byName snoozeUntil createdAt }
    }
`;

export const RATE_COURSE_CONTENT = gql`
    mutation RateCourseContent($contentId: ID!, $rating: Int!, $comment: String) {
        rateCourseContent(contentId: $contentId, rating: $rating, comment: $comment) { rating comment updatedAt }
    }
`;
