import { CreateAudioFromDocumentMutationVariables } from '../API'

import {
	util,
	DynamoDBPutItemRequest,
	Context,
	AppSyncIdentityCognito,
} from '@aws-appsync/utils'

export function request(
	ctx: Context<CreateAudioFromDocumentMutationVariables>
): DynamoDBPutItemRequest {
	let id = util.autoId()

	return {
		operation: 'PutItem',
		key: util.dynamodb.toMapValues({ id }),
		attributeValues: util.dynamodb.toMapValues({
			__typename: 'DocAudioFile',
			owner: (ctx.identity as AppSyncIdentityCognito).sub,
			createdAt: util.time.nowISO8601(),
			updatedAt: util.time.nowISO8601(),
			documentKey: ctx.args.input.documentKey,
			audioKey: 'something.mp3',
		}),
	}
}

export function response(ctx: Context) {
	console.log('prevContext', ctx.prev.result)
	console.log('full context', ctx)
	console.log('response', JSON.stringify(ctx))
	return ctx.result
}
