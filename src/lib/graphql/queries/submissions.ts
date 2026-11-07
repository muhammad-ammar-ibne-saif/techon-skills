import { gql } from "@apollo/client";

export const GET_SUBMISSIONS_FOR_COURSE = gql`
  query GetSubmissionsForCourse($courseId: ID!, $status: String) {
    getSubmissionsForCourse(courseId: $courseId, status: $status) {
      id
      userId
      courseId
      type
      referenceId
      title
      mcqScore
      mcqMax
      mcqCount
      shortAnswers {
        questionId
        questionText
        answer
        maxMarks
        marksAwarded
      }
      attachmentUrl
      attachmentUrls
      resubmitAllowed
      passingGrade
      canStudentSubmit
      marks
      maxMarks
      status
      markedAt
      feedback
      markingGuide
      createdAt
      user {
        id
        email
        fullName
      }
    }
  }
`;

export const GET_SUBMISSIONS_FOR_ASSIGNMENT = gql`
  query GetSubmissionsForAssignment($assignmentId: ID!) {
    getSubmissionsForAssignment(assignmentId: $assignmentId) {
      id
      userId
      courseId
      type
      referenceId
      title
      mcqScore
      mcqMax
      mcqCount
      shortAnswers {
        questionId
        questionText
        answer
        maxMarks
        marksAwarded
      }
      attachmentUrl
      attachmentUrls
      resubmitAllowed
      passingGrade
      canStudentSubmit
      marks
      maxMarks
      status
      markedAt
      feedback
      markingGuide
      createdAt
      user {
        id
        email
        fullName
      }
    }
  }
`;

export const GET_MY_SUBMISSIONS = gql`
  query GetMySubmissions($courseId: ID) {
    getMySubmissions(courseId: $courseId) {
      id
      courseId
      type
      referenceId
      title
      mcqScore
      mcqMax
      marks
      maxMarks
      status
      markedAt
      feedback
      createdAt
      attachmentUrl
      attachmentUrls
      resubmitAllowed
      passingGrade
      canStudentSubmit
    }
  }
`;

export const GET_MY_MARKS_SUMMARY = gql`
  query GetMyMarksSummary {
    getMyMarksSummary {
      totalSubmissions
      markedCount
      averageMarks
      submissions {
        id
        courseId
        type
        referenceId
        title
        mcqScore
        mcqMax
        marks
        maxMarks
        status
        markedAt
        feedback
        createdAt
        canStudentSubmit
      }
    }
  }
`;

export const GET_SUBMISSION_BY_REFERENCE = gql`
  query GetSubmissionByReference($userId: ID!, $courseId: ID!, $type: String!, $referenceId: String!) {
    getSubmissionByReference(userId: $userId, courseId: $courseId, type: $type, referenceId: $referenceId) {
      id
      status
      marks
      maxMarks
      markedAt
      feedback
      attachmentUrl
      attachmentUrls
      resubmitAllowed
      passingGrade
      canStudentSubmit
      shortAnswers {
        questionId
        answer
      }
    }
  }
`;
