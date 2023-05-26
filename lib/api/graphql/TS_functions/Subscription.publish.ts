import { Context, extensions } from '@aws-appsync/utils'

export function request(ctx: Context) {
	console.log('the subscription context', ctx)
	const data = JSON.parse(ctx.args.data)
	console.log('the subscritiopn data parsed', data)

	// return extensions.setSubscriptionFilter({
	// 	filterGroup: [
	// 		{
	// 			filters: [
	// 				{
	// 					fieldName: 'severity',
	// 					operator: 'ge',
	// 					value: 7,
	// 				},
	// 			],
	// 		},
	// 	],
	// })
	return ctx.prev.result
}

export function response(ctx: Context) {
	return ctx.result
}
