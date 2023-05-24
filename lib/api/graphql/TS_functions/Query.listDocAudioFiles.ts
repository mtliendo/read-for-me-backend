import {
	AppSyncIdentityCognito,
	Context,
	DynamoDBQueryRequest,
	util,
} from '@aws-appsync/utils'
import { DocAudioFile } from '../API'

export function request(ctx: Context): DynamoDBQueryRequest {
	const identity = ctx.identity as AppSyncIdentityCognito

	return {
		operation: 'Query',
		query: {
			expression: '#t = :typename and #o = :owner',
			expressionNames: { '#t': '__typename', '#o': 'owner' },
			expressionValues: util.dynamodb.toMapValues({
				':typename': 'DocAudioFile',
				':owner': identity.sub,
			}),
		},
		index: 'DocAudioFile-by-owner',
	}
}

export function response(ctx: Context) {
	const response = ctx.result.items

	return response as [DocAudioFile]
}
