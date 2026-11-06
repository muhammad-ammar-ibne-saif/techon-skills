import { gql } from "@apollo/client";

export const QUESTION_FIELDS = gql`
    fragment QuestionFields on Question {
        id
        courseId
        courseTitle
        recordingId
        recordingTitle
        body
        atSeconds
        mine
        resolved
        answeredByStaff
        createdAt
        author { id name isStaff }
        answers { id body isStaff mine createdAt author { id name isStaff } }
    }
`;

export const GET_RECORDING_QUESTIONS = gql`
    ${QUESTION_FIELDS}
    query GetRecordingQuestions($recordingId: ID!) {
        getRecordingQuestions(recordingId: $recordingId) { ...QuestionFields }
    }
`;

export const GET_QUESTIONS_FOR_STAFF = gql`
    ${QUESTION_FIELDS}
    query GetQuestionsForStaff($courseId: ID, $unansweredOnly: Boolean) {
        getQuestionsForStaff(courseId: $courseId, unansweredOnly: $unansweredOnly) { ...QuestionFields }
    }
`;
