import { gql } from "@apollo/client";

export const GET_ADMIN_DASHBOARD = gql`
  query GetAdminDashboard {
    getAdminDashboard {
      totalRevenue
      totalContactSubmissions
      totalRegisteredStudents
      recentActivity {
        id
        type
        user
        action
        time
      }
      pendingTasks {
        id
        title
        priority
      }
      enrolledPerCourse {
        slug
        name
        enrolled
      }
      monthlyRevenue {
        month
        revenue
      }
      monthlyContactSubmissions {
        month
        count
      }
      monthlyRegistrations {
        month
        count
      }
      monthlyActivity {
        month
        quizAttempts
        assignmentSubmissions
      }
    }
  }
`;

export const GET_PUBLIC_SITE_STATS = gql`
    query GetPublicSiteStats {
        publicSiteStats {
            students
            projectsMarked
            mentors
            courses
            lowestCourseFee
            currency
        }
    }
`;
