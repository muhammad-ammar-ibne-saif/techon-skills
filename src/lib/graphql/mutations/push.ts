import { gql } from "@apollo/client";

export const SAVE_PUSH_SUBSCRIPTION = gql`
    mutation SavePushSubscription($input: PushSubscriptionInput!) {
        savePushSubscription(input: $input)
    }
`;

export const REMOVE_PUSH_SUBSCRIPTION = gql`
    mutation RemovePushSubscription($endpoint: String!) {
        removePushSubscription(endpoint: $endpoint)
    }
`;
