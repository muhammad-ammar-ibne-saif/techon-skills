import { gql } from "@apollo/client";

export const CREATE_CERTIFICATE_TEMPLATE = gql`
  mutation CreateCertificateTemplate($input: CertificateTemplateInput!) {
    createCertificateTemplate(input: $input) {
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
    }
  }
`;

export const UPDATE_CERTIFICATE_TEMPLATE = gql`
  mutation UpdateCertificateTemplate($id: ID!, $input: CertificateTemplateInput!) {
    updateCertificateTemplate(id: $id, input: $input) {
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
    }
  }
`;

export const DELETE_CERTIFICATE_TEMPLATE = gql`
  mutation DeleteCertificateTemplate($id: ID!) {
    deleteCertificateTemplate(id: $id)
  }
`;

export const ISSUE_CERTIFICATE = gql`
  mutation IssueCertificate($input: IssueCertificateInput!) {
    issueCertificate(input: $input) {
      id
      verificationCode
      studentName
      courseName
      percentage
      grade
      message
      status
    }
  }
`;

export const PUBLISH_CERTIFICATE = gql`
  mutation PublishCertificate($id: ID!) {
    publishCertificate(id: $id) {
      id
      status
      issuedAt
    }
  }
`;

export const DELETE_CERTIFICATE = gql`
  mutation DeleteCertificate($id: ID!) {
    deleteCertificate(id: $id)
  }
`;
