import { gql } from "@apollo/client";
import { CANDIDATE_FIELDS, INTERVIEW_FIELDS, PLACEMENT_FIELDS, PRACTICE_FIELDS } from "../queries/careers";
import { JOB_FIELDS } from "../queries/jobs";

export const UPDATE_JOB_ALERT_SETTINGS = gql`
    mutation UpdateJobAlertSettings($jobAlerts: Boolean!, $jobAlertsEmail: Boolean!) {
        updateJobAlertSettings(jobAlerts: $jobAlerts, jobAlertsEmail: $jobAlertsEmail) { jobAlerts jobAlertsEmail openToWork }
    }
`;

export const DRAFT_COVER_NOTE = gql`
    mutation DraftCoverNote($jobId: ID!) {
        draftCoverNote(jobId: $jobId) { text source aiAvailable aiCallsLeftToday }
    }
`;

export const START_INTERVIEW_PRACTICE = gql`
    mutation StartInterviewPractice($jobId: ID!) {
        startInterviewPractice(jobId: $jobId) { ${PRACTICE_FIELDS} }
    }
`;

export const ANSWER_PRACTICE_QUESTION = gql`
    mutation AnswerPracticeQuestion($id: ID!, $index: Int!, $answer: String!) {
        answerPracticeQuestion(id: $id, index: $index, answer: $answer) { ${PRACTICE_FIELDS} }
    }
`;

export const DELETE_INTERVIEW_PRACTICE = gql`
    mutation DeleteInterviewPractice($id: ID!) {
        deleteInterviewPractice(id: $id)
    }
`;

export const RESPOND_TO_INTERVIEW = gql`
    mutation RespondToInterview($id: ID!, $accept: Boolean!, $note: String) {
        respondToInterview(id: $id, accept: $accept, note: $note) { ${INTERVIEW_FIELDS} }
    }
`;

export const SHORTLIST_CANDIDATE = gql`
    mutation ShortlistCandidate($studentId: ID!, $note: String) {
        shortlistCandidate(studentId: $studentId, note: $note) { ${CANDIDATE_FIELDS} }
    }
`;

export const REMOVE_FROM_SHORTLIST = gql`
    mutation RemoveFromShortlist($studentId: ID!) {
        removeFromShortlist(studentId: $studentId)
    }
`;

export const INVITE_CANDIDATE = gql`
    mutation InviteCandidate($studentId: ID!, $jobId: ID!, $message: String) {
        inviteCandidate(studentId: $studentId, jobId: $jobId, message: $message)
    }
`;

export const SCHEDULE_INTERVIEW = gql`
    mutation ScheduleInterview($input: InterviewInput!) {
        scheduleInterview(input: $input) { ${INTERVIEW_FIELDS} }
    }
`;

export const UPDATE_INTERVIEW = gql`
    mutation UpdateInterview($id: ID!, $input: InterviewInput!) {
        updateInterview(id: $id, input: $input) { ${INTERVIEW_FIELDS} }
    }
`;

export const CANCEL_INTERVIEW = gql`
    mutation CancelInterview($id: ID!, $reason: String) {
        cancelInterview(id: $id, reason: $reason) { ${INTERVIEW_FIELDS} }
    }
`;

export const REPORT_MY_PLACEMENT = gql`
    mutation ReportMyPlacement($input: PlacementInput!) {
        reportMyPlacement(input: $input) { ${PLACEMENT_FIELDS} }
    }
`;

export const DELETE_MY_PLACEMENT = gql`
    mutation DeleteMyPlacement($id: ID!) {
        deleteMyPlacement(id: $id)
    }
`;

export const CREATE_PLACEMENT = gql`
    mutation CreatePlacement($input: PlacementInput!) {
        createPlacement(input: $input) { ${PLACEMENT_FIELDS} }
    }
`;

export const UPDATE_PLACEMENT = gql`
    mutation UpdatePlacement($id: ID!, $input: PlacementInput!) {
        updatePlacement(id: $id, input: $input) { ${PLACEMENT_FIELDS} }
    }
`;

export const VERIFY_PLACEMENT = gql`
    mutation VerifyPlacement($id: ID!, $verified: Boolean!) {
        verifyPlacement(id: $id, verified: $verified) { ${PLACEMENT_FIELDS} }
    }
`;

export const DELETE_PLACEMENT = gql`
    mutation DeletePlacement($id: ID!) {
        deletePlacement(id: $id)
    }
`;

export const SET_ALUMNI_BY_EMAIL = gql`
    mutation SetAlumniByEmail($email: String!, $isAlumni: Boolean!) {
        setAlumniByEmail(email: $email, isAlumni: $isAlumni) { isAlumni since }
    }
`;

export const POST_ALUMNI_JOB = gql`
    mutation PostAlumniJob($input: JobInput!) {
        postAlumniJob(input: $input) { ${JOB_FIELDS} applicationsCount reviewNote }
    }
`;

export const UPDATE_ALUMNI_JOB = gql`
    mutation UpdateAlumniJob($id: ID!, $input: JobInput!) {
        updateAlumniJob(id: $id, input: $input) { ${JOB_FIELDS} applicationsCount reviewNote }
    }
`;

export const CLOSE_ALUMNI_JOB = gql`
    mutation CloseAlumniJob($id: ID!) {
        closeAlumniJob(id: $id) { ${JOB_FIELDS} applicationsCount reviewNote }
    }
`;

export const REVIEW_ALUMNI_JOB = gql`
    mutation ReviewAlumniJob($id: ID!, $approve: Boolean!, $note: String) {
        reviewAlumniJob(id: $id, approve: $approve, note: $note) { ${JOB_FIELDS} applicationsCount reviewNote }
    }
`;
