import { gql } from "@apollo/client";

export const GET_PUSH_CONFIG = gql`
    query GetPushConfig {
        getPushConfig {
            enabled
            publicKey
        }
    }
`;
