import { gql } from "@apollo/client";

const RECORDING_FIELDS = `
    id
    courseId
    course { id title slug }
    lectureId
    batchIds
    batches { id name }
    title
    description
    recordedAt
    durationSeconds
    sizeBytes
    isPublished
    driveFileId
    driveFileName
    createdAt
`;

export const GET_RECORDINGS_SETUP = gql`
    query GetRecordingsSetup {
        getRecordingsSetup {
            driveConfigured
            serviceAccountEmail
        }
    }
`;

export const GET_RECORDINGS_FOR_STAFF = gql`
    query GetRecordingsForStaff($courseId: ID) {
        getRecordingsForStaff(courseId: $courseId) {
            ${RECORDING_FIELDS}
        }
    }
`;

export const GET_MY_RECORDINGS = gql`
    query GetMyRecordings($courseId: ID) {
        getMyRecordings(courseId: $courseId) {
            id
            courseId
            course { id title slug }
            title
            description
            recordedAt
            durationSeconds
        }
    }
`;

export const GET_RECORDING_PLAYBACK = gql`
    query GetRecordingPlayback($id: ID!) {
        getRecordingPlayback(id: $id) {
            url
            mimeType
            expiresAt
        }
    }
`;

export const RECORDING_FOLDER_FIELDS = `
    id
    courseId
    course { id title }
    batchIds
    batches { id name }
    name
    driveFolderId
    lastSyncedAt
    lastSyncError
    recordingCount
`;

export const GET_RECORDING_FOLDERS = gql`
    query GetRecordingFolders($courseId: ID) {
        getRecordingFolders(courseId: $courseId) {
            ${RECORDING_FOLDER_FIELDS}
        }
    }
`;
