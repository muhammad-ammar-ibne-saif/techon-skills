import { gql } from "@apollo/client";

export const GET_AT_RISK_STUDENTS = gql`
    query GetAtRiskStudents($courseId: ID, $batchId: ID) {
        atRiskStudents(courseId: $courseId, batchId: $batchId) {
            userId
            fullName
            email
            phoneNumber
            courseId
            courseTitle
            batchName
            attendancePercent
            lecturesMarked
            missedAssignments
            unwatchedRecordings
            overdueAmount
            lastActivityAt
            flags
            reasons
        }
    }
`;

export const GET_INSIGHT_REPORTS = gql`
    query GetInsightReports {
        insightReports {
            inactiveDays
            batches {
                batchId
                batchName
                courseId
                courseTitle
                isArchived
                students
                feeTotal
                feeCollected
                feeDueNow
                feeOverdue
                collectedPercent
                inactiveStudents
                dropoutPercent
            }
            courses {
                courseId
                courseTitle
                students
                revenue
                outstanding
                averagePerStudent
            }
        }
    }
`;
