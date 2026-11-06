import { gql } from "@apollo/client";

export const GET_COURSES = gql`
    query GetCourses {
        getCourses {
            id
            title
            slug
            subtitle
            subDescription
            heroDescription
            totalFee
            feePerMonth
            courseDurationInMonths
            totalNumberOfInstallments
            currency
            isFree
            freeLabel
            technologies {
                label
                description
                logo
            }
            articleFeatures {
                name
                description
                image
            }
        }
    }
`;

export const GET_COURSE = gql`
    query GetCourse($id: ID!) {
        getCourse(id: $id) {
            id
            title
            slug
            heroDescription
            subtitle
            subDescription
            totalFee
            feePerMonth
            courseDurationInMonths
            totalNumberOfInstallments
            currency
            isFree
            freeLabel
            technologies {
                label
                description
                logo
            }
            articleFeatures {
                name
                description
                image
            }
        }
    }
`;

export const GET_COURSE_BY_SLUG = gql`
    query GetCourseBySlug($slug: String!) {
        getCourseBySlug(slug: $slug) {
            id
            title
            slug
            heroDescription
            subtitle
            subDescription
            totalFee
            feePerMonth
            courseDurationInMonths
            totalNumberOfInstallments
            currency
            isFree
            freeLabel
            technologies {
                label
                description
                logo
            }
            articleFeatures {
                name
                description
                image
            }
        }
    }
`;
