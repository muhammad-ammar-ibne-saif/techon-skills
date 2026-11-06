import { gql } from "@apollo/client";

export const SITE_POPUP_FIELDS = `
    id
    title
    text
    images
    buttonLabel
    buttonUrl
    isActive
    startsAt
    endsAt
    updatedAt
`;

export const DEAL_FIELDS = `
    id
    title
    description
    image
    badge
    courses { id title slug }
    courseIds
    couponCode
    originalPrice
    dealPrice
    currency
    buttonLabel
    isActive
    startsAt
    endsAt
    endsAtTime
    displayOrder
    enrollUrl
`;

export const GET_ACTIVE_POPUP = gql`
    query GetActivePopup {
        getActivePopup { ${SITE_POPUP_FIELDS} }
    }
`;

export const GET_ACTIVE_DEALS = gql`
    query GetActiveDeals {
        getActiveDeals { ${DEAL_FIELDS} }
    }
`;

export const GET_SITE_POPUPS = gql`
    query GetSitePopups {
        getSitePopups { ${SITE_POPUP_FIELDS} }
    }
`;

export const GET_DEALS = gql`
    query GetDeals {
        getDeals { ${DEAL_FIELDS} }
    }
`;
