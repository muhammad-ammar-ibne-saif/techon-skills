import { gql } from "@apollo/client";

export const RESUME_FIELDS = `
    id
    kind
    jobId
    mode
    fullName
    headline
    email
    phone
    location
    summary
    skills
    links { label url }
    projects { title description url repoUrl tech portfolioIndex portfolioLink reason }
    experience { role company start end description }
    education { school degree start end }
    showPortfolioLink
    portfolioUrl
    latex
    generatedLatex
    pdfUrl
    tailorSource
    tailorNote
    outdated
    aiAvailable
    aiRunsLeftToday
    updatedAt
`;

export const GET_MY_RESUME = gql`
    query GetMyResume {
        myResume { ${RESUME_FIELDS} }
    }
`;

export const GET_MY_TAILORED_RESUME = gql`
    query GetMyTailoredResume($jobId: ID!) {
        myTailoredResume(jobId: $jobId) {
            ${RESUME_FIELDS}
            job { id title companyName }
        }
    }
`;
