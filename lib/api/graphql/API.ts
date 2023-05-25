/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type DocAudioInput = {
  documentKey: string,
  preferredLanguage: PREFERRED_LANGUAGE_ENUM,
  cognitoIdentityId: string,
};

export enum PREFERRED_LANGUAGE_ENUM {
  en = "en",
  es = "es",
}


export type DocAudioFile = {
  __typename: "DocAudioFile",
  id: string,
  owner: string,
  createdAt: string,
  updatedAt: string,
  documentKey: string,
  audioKey: string,
};

export type CreateAudioFromDocumentMutationVariables = {
  input: DocAudioInput,
};

export type CreateAudioFromDocumentMutation = {
  createAudioFromDocument?:  {
    __typename: "DocAudioFile",
    id: string,
    owner: string,
    createdAt: string,
    updatedAt: string,
    documentKey: string,
    audioKey: string,
  } | null,
};

export type ListAudioFilesQuery = {
  listAudioFiles?:  Array< {
    __typename: "DocAudioFile",
    id: string,
    owner: string,
    createdAt: string,
    updatedAt: string,
    documentKey: string,
    audioKey: string,
  } | null > | null,
};
