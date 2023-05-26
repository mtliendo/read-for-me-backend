/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createAudioFromDocument = /* GraphQL */ `
  mutation CreateAudioFromDocument($input: DocAudioInput!) {
    createAudioFromDocument(input: $input) {
      id
      owner
      createdAt
      updatedAt
      documentKey
      audioKey
    }
  }
`;
export const publish = /* GraphQL */ `
  mutation Publish($data: AWSJSON) {
    publish(data: $data)
  }
`;
