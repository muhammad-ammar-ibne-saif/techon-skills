import { gql } from "@apollo/client";
import { DEAL_FIELDS, SITE_POPUP_FIELDS } from "../queries/promotions";

export const CREATE_SITE_POPUP = gql`
    mutation CreateSitePopup($input: SitePopupInput!) {
        createSitePopup(input: $input) { ${SITE_POPUP_FIELDS} }
    }
`;

export const UPDATE_SITE_POPUP = gql`
    mutation UpdateSitePopup($id: ID!, $input: SitePopupInput!) {
        updateSitePopup(id: $id, input: $input) { ${SITE_POPUP_FIELDS} }
    }
`;

export const DELETE_SITE_POPUP = gql`
    mutation DeleteSitePopup($id: ID!) {
        deleteSitePopup(id: $id)
    }
`;

export const CREATE_DEAL = gql`
    mutation CreateDeal($input: DealInput!) {
        createDeal(input: $input) { ${DEAL_FIELDS} }
    }
`;

export const UPDATE_DEAL = gql`
    mutation UpdateDeal($id: ID!, $input: DealInput!) {
        updateDeal(id: $id, input: $input) { ${DEAL_FIELDS} }
    }
`;

export const DELETE_DEAL = gql`
    mutation DeleteDeal($id: ID!) {
        deleteDeal(id: $id)
    }
`;

export const REORDER_DEALS = gql`
    mutation ReorderDeals($ids: [ID!]!) {
        reorderDeals(ids: $ids) { ${DEAL_FIELDS} }
    }
`;
