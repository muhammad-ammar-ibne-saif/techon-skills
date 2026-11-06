import { gql } from "@apollo/client";
import { COUPON_FIELDS } from "../queries/offers";

export const CREATE_COUPON = gql`
    mutation CreateCoupon($input: CouponInput!) {
        createCoupon(input: $input) { ${COUPON_FIELDS} }
    }
`;

export const UPDATE_COUPON = gql`
    mutation UpdateCoupon($id: ID!, $input: CouponInput!) {
        updateCoupon(id: $id, input: $input) { ${COUPON_FIELDS} }
    }
`;

export const DELETE_COUPON = gql`
    mutation DeleteCoupon($id: ID!) {
        deleteCoupon(id: $id)
    }
`;

export const UPDATE_REFERRAL_SETTINGS = gql`
    mutation UpdateReferralSettings($input: ReferralSettingsInput!) {
        updateReferralSettings(input: $input) { isActive referrerReward friendDiscount }
    }
`;

export const NOTIFY_WAITLIST_ENTRY = gql`
    mutation NotifyWaitlistEntry($id: ID!) {
        notifyWaitlistEntry(id: $id) { id status notifiedAt }
    }
`;

export const REMOVE_WAITLIST_ENTRY = gql`
    mutation RemoveWaitlistEntry($id: ID!) {
        removeWaitlistEntry(id: $id)
    }
`;
