import { gql } from "@apollo/client";

export const GET_BATCHES = gql`
    query GetBatches($courseId: ID!, $includeArchived: Boolean) {
        getBatches(courseId: $courseId, includeArchived: $includeArchived) {
            id
            courseId
            name
            isArchived
            studentCount
            createdAt
        }
    }
`;

export const GET_BATCH_ROSTER = gql`
    query GetBatchRoster($courseId: ID!) {
        getBatchRoster(courseId: $courseId) {
            id
            fullName
            email
            batchId
        }
    }
`;
