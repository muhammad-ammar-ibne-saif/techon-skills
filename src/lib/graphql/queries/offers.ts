import { gql } from "@apollo/client";

export const COUPON_FIELDS = `
    id
    code
    label
    kind
    value
    courseIds
    validFrom
    validUntil
    maxUses
    usedCount
    isActive
    note
    createdAt
`;

export const GET_COUPONS = gql`
    query GetCoupons {
        getCoupons { ${COUPON_FIELDS} }
    }
`;

export const GET_REFERRAL_SETTINGS = gql`
    query GetReferralSettings {
        getReferralSettings { isActive referrerReward friendDiscount }
    }
`;

export const GET_REFERRALS_ADMIN = gql`
    query GetReferralsAdmin {
        getReferralsAdmin { id friendName friendEmail referrerName referrerEmail status rewardAmount rewardApplied createdAt }
    }
`;

export const GET_MY_REFERRAL = gql`
    query GetMyReferral {
        getMyReferral {
            code
            totalEarned
            settings { isActive referrerReward friendDiscount }
            referrals { id friendName status rewardAmount rewardApplied createdAt }
        }
    }
`;

export const GET_WAITLIST = gql`
    query GetWaitlist($batchId: ID!) {
        getWaitlist(batchId: $batchId) { id name email phone status notifiedAt createdAt }
    }
`;
