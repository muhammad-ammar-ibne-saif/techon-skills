import { gql } from "@apollo/client";

export const CREATE_RECURRING_LECTURE_SCHEDULE = gql`
  mutation CreateRecurringLectureSchedule($input: CreateRecurringLectureScheduleInput!) {
    createRecurringLectureSchedule(input: $input) {
      id
      seriesId
      startAt
      title
    }
  }
`;

export const UPDATE_LECTURE = gql`
  mutation UpdateLecture($id: ID!, $input: LectureUpdateInput!) {
    updateLecture(id: $id, input: $input) {
      id
      title
      meetUrl
      durationMins
      startAt
      seriesId
      courseName
    }
  }
`;

export const DELETE_LECTURE = gql`
  mutation DeleteLecture($id: ID!) {
    deleteLecture(id: $id)
  }
`;

export const DELETE_LECTURE_SERIES = gql`
  mutation DeleteLectureSeries($seriesId: ID!) {
    deleteLectureSeries(seriesId: $seriesId)
  }
`;

export const JOIN_LECTURE = gql`
    mutation JoinLecture($lectureId: ID!) {
        joinLecture(lectureId: $lectureId) {
            meetUrl
            attendanceStatus
        }
    }
`;
