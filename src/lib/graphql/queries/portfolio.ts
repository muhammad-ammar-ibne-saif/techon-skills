import { gql } from "@apollo/client";

export const PORTFOLIO_FIELDS = `
    slug
    url
    fullName
    profilePicture
    headline
    bio
    location
    skills
    github
    linkedin
    website
    links { label url }
    projects { title description url repoUrl image tech }
    experience { role company start end description }
    education { school degree start end }
    cvUrl
    openToWork
    isPublic
    showMarks
    certificates { courseName grade percentage verificationCode issuedAt }
    courses
    averageMark
    updatedAt
`;

export const GET_MY_PORTFOLIO = gql`
    query GetMyPortfolio {
        myPortfolio { ${PORTFOLIO_FIELDS} }
    }
`;

export const GET_PORTFOLIO = gql`
    query GetPortfolio($slug: String!) {
        portfolio(slug: $slug) { ${PORTFOLIO_FIELDS} }
    }
`;
