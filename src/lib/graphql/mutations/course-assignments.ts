import { gql } from "@apollo/client";

export const CREATE_COURSE_ASSIGNMENT = gql`
  mutation CreateCourseAssignment($input: CreateCourseAssignmentInput!) {
    createCourseAssignment(input: $input) {
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
    }
  }
`;

export const SET_ASSIGNMENT_MARKING_GUIDE = gql`
  mutation SetAssignmentMarkingGuide($id: ID!, $markingGuide: String!) {
    setAssignmentMarkingGuide(id: $id, markingGuide: $markingGuide) {
      id
      markingGuide
    }
  }
`;

export const PUBLISH_COURSE_ASSIGNMENT = gql`
  mutation PublishCourseAssignment($id: ID!) {
    publishCourseAssignment(id: $id) {
      id
      isPublished
      publishedAt
    }
  }
`;

export const DELETE_COURSE_ASSIGNMENT = gql`
  mutation DeleteCourseAssignment($id: ID!) {
    deleteCourseAssignment(id: $id)
  }
`;
