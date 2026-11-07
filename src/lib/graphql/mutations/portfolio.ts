import { gql } from "@apollo/client";
import { PORTFOLIO_FIELDS } from "../queries/portfolio";

export const UPDATE_MY_PORTFOLIO = gql`
    mutation UpdateMyPortfolio($input: PortfolioInput!) {
        updateMyPortfolio(input: $input) { ${PORTFOLIO_FIELDS} }
    }
`;
