import { Context } from '@aws-appsync/utils'

export function request(ctx: Context) {
	return {
		method: 'POST',
		resourcePath: '/',
		params: {
			headers: {
				'content-type': 'application/x-amz-json-1.1',
				'x-amz-target': 'AmazonTextract.DetectDocumentText',
			},
			body: {
				Document: {
					S3Object: {
						Bucket: ctx.stash.bucketName,
						Name: ctx.args.input.documentKey,
					},
				},
			},
		},
	}
}

export function response(ctx: Context) {
	console.log(ctx.result.body)
	const result = JSON.parse(ctx.result.body).Parameter.Value
	console.log(result)
	return result
}
