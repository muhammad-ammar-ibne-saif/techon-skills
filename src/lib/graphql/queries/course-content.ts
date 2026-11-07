import { gql } from "@apollo/client";

export const GET_COURSE_CONTENTS_FOR_STAFF = gql`
  query GetCourseContentsForStaff($courseId: ID!) {
    getCourseContentsForStaff(courseId: $courseId) {
      id
      courseId
      title
      description
      attachments {
        url
        filename
        contentType
      }
      sortOrder
      isPublished
      publishedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_PUBLISHED_COURSE_CONTENTS = gql`
  query GetPublishedCourseContents($courseId: ID!) {
    getPublishedCourseContents(courseId: $courseId) {
      id
      courseId
      title
      description
      attachments {
        url
        filename
        contentType
      }
      sortOrder
      createdAt
      course {
        id
        title
        slug
      }
    }
  }
`;

export const GET_MY_PUBLISHED_COURSE_CONTENTS = gql`
  query GetMyPublishedCourseContents {
    getMyPublishedCourseContents {
      id
      myFeedback {
        rating
        comment
        updatedAt
      }
      courseId
      title
      description
      attachments {
        url
        filename
        contentType
      }
      sortOrder
      createdAt
      course {
        id
        title
        slug
      }
    }
  }
`;
