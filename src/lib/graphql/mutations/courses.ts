import { gql } from "@apollo/client";

export const CREATE_COURSE = gql`
    mutation CreateCourse($input: CourseCreateInput!) {
        createCourse(input: $input) {
            id
            title
            slug
        }
    }
`;

export const UPDATE_COURSE = gql`
    mutation UpdateCourse($input: CourseUpdateInput!) {
        updateCourse(input: $input) {
            id
            title
            slug
        }
    }
`;

export const DELETE_COURSE = gql`
    mutation DeleteCourse($input: CourseDeleteInput!) {
        deleteCourse(input: $input)
    }
`;

export const REORDER_COURSES = gql`
    mutation ReorderCourses($ids: [ID!]!) {
        reorderCourses(ids: $ids) {
            id
        }
    }
`;
