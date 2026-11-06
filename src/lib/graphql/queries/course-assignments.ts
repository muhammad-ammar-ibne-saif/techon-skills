import { gql } from "@apollo/client";

export const GET_COURSE_ASSIGNMENTS = gql`
  query GetCourseAssignments($courseId: ID!) {
    getCourseAssignments(courseId: $courseId) {
      id
      courseId
      title
      description
      guidelines
      markingGuide
      attachmentUrls
      maxMarks
      referenceId
      dueDate
      isPublished
      publishedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_COURSE_ASSIGNMENT_BY_ID = gql`
  query GetCourseAssignmentById($id: ID!) {
    getCourseAssignmentById(id: $id) {
      id
      courseId
      title
      description
      guidelines
      markingGuide
      attachmentUrls
      maxMarks
      referenceId
      dueDate
      createdAt
      course {
        id
        title
      }
    }
  }
`;

export const GET_MY_COURSE_ASSIGNMENTS = gql`
  query GetMyCourseAssignments {
    getMyCourseAssignments {
      id
      courseId
      title
      description
      guidelines
      attachmentUrls
      maxMarks
      referenceId
      dueDate
      createdAt
      course {
        id
        title
      }
    }
  }
`;

export const GET_COURSE_ASSIGNMENT_FOR_STUDENT = gql`
  query GetCourseAssignmentForStudent($id: ID!) {
    getCourseAssignmentForStudent(id: $id) {
      id
      courseId
      title
      description
      guidelines
      attachmentUrls
      maxMarks
      referenceId
      dueDate
      course {
        id
        title
      }
    }
  }
`;
