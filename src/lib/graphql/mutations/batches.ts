import { gql } from "@apollo/client";

export const CREATE_BATCH = gql`
    mutation CreateBatch($courseId: ID!, $name: String!, $startDate: String, $seats: Int, $isOpenForEnrollment: Boolean) {
        createBatch(courseId: $courseId, name: $name, startDate: $startDate, seats: $seats, isOpenForEnrollment: $isOpenForEnrollment) {
            id
        }
    }
`;

export const UPDATE_BATCH = gql`
    mutation UpdateBatch(
        $id: ID!
        $name: String
        $isArchived: Boolean
        $startDate: String
        $clearStartDate: Boolean
        $seats: Int
        $clearSeats: Boolean
        $isOpenForEnrollment: Boolean
    ) {
        updateBatch(
            id: $id
            name: $name
            isArchived: $isArchived
            startDate: $startDate
            clearStartDate: $clearStartDate
            seats: $seats
            clearSeats: $clearSeats
            isOpenForEnrollment: $isOpenForEnrollment
        ) {
            id
        }
    }
`;

export const MERGE_BATCHES = gql`
    mutation MergeBatches($fromBatchIds: [ID!]!, $intoBatchId: ID!) {
        mergeBatches(fromBatchIds: $fromBatchIds, intoBatchId: $intoBatchId)
    }
`;

export const SET_STUDENTS_BATCH = gql`
    mutation SetStudentsBatch($courseId: ID!, $userIds: [ID!]!, $batchId: ID) {
        setStudentsBatch(courseId: $courseId, userIds: $userIds, batchId: $batchId)
    }
`;
