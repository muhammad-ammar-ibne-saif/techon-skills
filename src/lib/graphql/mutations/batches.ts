import { gql } from "@apollo/client";

export const CREATE_BATCH = gql`
    mutation CreateBatch($courseId: ID!, $name: String!) {
        createBatch(courseId: $courseId, name: $name) {
            id
        }
    }
`;

export const UPDATE_BATCH = gql`
    mutation UpdateBatch($id: ID!, $name: String, $isArchived: Boolean) {
        updateBatch(id: $id, name: $name, isArchived: $isArchived) {
            id
        }
    }
`;

export const SET_STUDENTS_BATCH = gql`
    mutation SetStudentsBatch($courseId: ID!, $userIds: [ID!]!, $batchId: ID) {
        setStudentsBatch(courseId: $courseId, userIds: $userIds, batchId: $batchId)
    }
`;
