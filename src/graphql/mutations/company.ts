import { gql } from '@apollo/client';

export const CREATE_OR_UPDATE_COMPANY = gql`
  mutation CreateOrUpdateCompany($input: CompanyInput!) {
    createOrUpdateCompany(input: $input) {
      id
      name
      nationalCode
      address
      phone
      email
      financialYearStart
      financialYearEnd
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_COMPANY = gql`
  query GetCompany {
    getCompany {
      id
      name
      nationalCode
      address
      phone
      email
      financialYearStart
      financialYearEnd
      isActive
      createdAt
      updatedAt
    }
  }
`;