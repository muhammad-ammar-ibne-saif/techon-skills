import { gql } from "@apollo/client";
import { QUESTION_FIELDS } from "../queries/questions";

export const ASK_QUESTION = gql`
    ${QUESTION_FIELDS}
    mutation AskQuestion($recordingId: ID!, $body: String!, $atSeconds: Float) {
        askQuestion(recordingId: $recordingId, body: $body, atSeconds: $atSeconds) { ...QuestionFields }
    }
`;

export const ANSWER_QUESTION = gql`
    ${QUESTION_FIELDS}
    mutation AnswerQuestion($questionId: ID!, $body: String!) {
        answerQuestion(questionId: $questionId, body: $body) { ...QuestionFields }
    }
`;

export const SET_QUESTION_RESOLVED = gql`
    ${QUESTION_FIELDS}
    mutation SetQuestionResolved($questionId: ID!, $resolved: Boolean!) {
        setQuestionResolved(questionId: $questionId, resolved: $resolved) { ...QuestionFields }
    }
`;

export const DELETE_QUESTION = gql`
    mutation DeleteQuestion($questionId: ID!) {
        deleteQuestion(questionId: $questionId)
    }
`;

export const DELETE_ANSWER = gql`
    ${QUESTION_FIELDS}
    mutation DeleteAnswer($questionId: ID!, $answerId: ID!) {
        deleteAnswer(questionId: $questionId, answerId: $answerId) { ...QuestionFields }
    }
`;
