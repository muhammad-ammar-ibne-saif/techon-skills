import { gql } from "@apollo/client";

export const GET_CERTIFICATE_TEMPLATES = gql`
  query GetCertificateTemplates {
    getCertificateTemplates {
      id
      name
      titleLine
      subtitleLine
      bodyTemplate
      footerLine
      directorName
      directorTitle
      mentorName
      mentorTitle
      isDefault
      createdAt
      updatedAt
    }
  }
`;

export const GET_CERTIFICATES_ADMIN = gql`
  query GetCertificatesAdmin {
    getCertificatesAdmin {
      id
      verificationCode
      userId
      courseId
      templateId
      studentName
      courseName
      percentage
      grade
      message
      status
      issuedAt
      details { durationMonths batchName projectsGraded }
      createdAt
      template {
        id
        name
        titleLine
        subtitleLine
        footerLine
        directorName
        directorTitle
        mentorName
        mentorTitle
      }
    }
  }
`;

export const GET_MY_CERTIFICATES = gql`
  query GetMyCertificates {
    getMyCertificates {
      id
      verificationCode
      courseId
      courseName
      percentage
      grade
      status
      issuedAt
      createdAt
      template {
        id
        titleLine
        footerLine
        directorName
        directorTitle
        mentorName
        mentorTitle
      }
    }
  }
`;

export const GET_CERTIFICATE_BY_ID = gql`
  query GetCertificateById($id: ID!) {
    getCertificateById(id: $id) {
      id
      verificationCode
      studentName
      courseName
      percentage
      grade
      message
      status
      issuedAt
      details { durationMonths batchName projectsGraded }
      createdAt
      template {
        id
        name
        titleLine
        subtitleLine
        footerLine
        directorName
        directorTitle
        mentorName
        mentorTitle
      }
    }
  }
`;

export const VERIFY_CERTIFICATE = gql`
  query VerifyCertificate($code: String!) {
    verifyCertificate(code: $code) {
      id
      verificationCode
      studentName
      courseName
      percentage
      grade
      message
      status
      issuedAt
      details { durationMonths batchName projectsGraded }
      template {
        titleLine
        subtitleLine
        footerLine
        directorName
        directorTitle
        mentorName
        mentorTitle
      }
    }
  }
`;
