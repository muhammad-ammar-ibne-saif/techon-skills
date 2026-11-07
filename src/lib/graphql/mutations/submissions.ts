import { gql } from "@apollo/client";

export const CREATE_SUBMISSION = gql`
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) {
      id
      status
      marks
      maxMarks
      createdAt
      attachmentUrl
      attachmentUrls
      resubmitAllowed
      passingGrade
      canStudentSubmit
    }
  }
`;

export const UPDATE_SUBMISSION_MARKS = gql`
  mutation UpdateSubmissionMarks($input: UpdateSubmissionMarksInput!) {
    updateSubmissionMarks(input: $input) {
      id
      marks
      status
      markedAt
      feedback
      resubmitAllowed
      passingGrade
      canStudentSubmit
      shortAnswers {
        questionId
        maxMarks
        marksAwarded
      }
    }
  }
`;

export const SET_SUBMISSION_RESUBMIT_ALLOWED = gql`
  mutation SetSubmissionResubmitAllowed($id: ID!, $allowed: Boolean!) {
    setSubmissionResubmitAllowed(id: $id, allowed: $allowed) {
      id
      status
      resubmitAllowed
      passingGrade
      canStudentSubmit
    }
  }
`;
