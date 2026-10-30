import { gql } from "@apollo/client";
import { RECORDING_FOLDER_FIELDS } from "../queries/recordings";

export const CREATE_RECORDING = gql`
    mutation CreateRecording($input: RecordingInput!) {
        createRecording(input: $input) {
            id
        }
    }
`;

export const UPDATE_RECORDING = gql`
    mutation UpdateRecording($input: RecordingUpdateInput!) {
        updateRecording(input: $input) {
            id
        }
    }
`;

export const DELETE_RECORDING = gql`
    mutation DeleteRecording($id: ID!) {
        deleteRecording(id: $id)
    }
`;

export const CHECK_RECORDING_ACCESS = gql`
    mutation CheckRecordingAccess($id: ID!) {
        checkRecordingAccess(id: $id) {
            ok
            message
        }
    }
`;

export const LINK_RECORDING_FOLDER = gql`
    mutation LinkRecordingFolder($courseId: ID!, $folderLink: String!, $batchIds: [ID!]) {
        linkRecordingFolder(courseId: $courseId, folderLink: $folderLink, batchIds: $batchIds) {
            added
            folder { ${RECORDING_FOLDER_FIELDS} }
        }
    }
`;

export const UPDATE_RECORDING_FOLDER = gql`
    mutation UpdateRecordingFolder($id: ID!, $batchIds: [ID!]!) {
        updateRecordingFolder(id: $id, batchIds: $batchIds) { ${RECORDING_FOLDER_FIELDS} }
    }
`;

export const SYNC_RECORDING_FOLDER = gql`
    mutation SyncRecordingFolder($id: ID!) {
        syncRecordingFolder(id: $id) {
            added
            folder { ${RECORDING_FOLDER_FIELDS} }
        }
    }
`;

export const UNLINK_RECORDING_FOLDER = gql`
    mutation UnlinkRecordingFolder($id: ID!, $removeRecordings: Boolean) {
        unlinkRecordingFolder(id: $id, removeRecordings: $removeRecordings)
    }
`;
