import { Context } from '@aws-appsync/utils'
import { extractWordsInOrder } from './utils/extractWordsInOrder'

export function request(ctx: Context) {
	return {
		method: 'POST',
		resourcePath: '/',
		params: {
			headers: {
				'content-type': 'application/x-amz-json-1.1',
				'x-amz-target': 'Textract.DetectDocumentText',
			},
			body: {
				Document: {
					S3Object: {
						Bucket: ctx.stash.bucketName,
						Name: `protected/test/${ctx.args.input.documentKey}`,
					},
				},
			},
		},
	}
}

export function response(ctx: Context) {
	// Assume textractResponse is the response from Textract's detect-document-text
	let wordsInOrder = extractWordsInOrder(JSON.parse(ctx.result.body))

	// Now you can do what you want with the wordsInOrder array
	const result = wordsInOrder.join(' ')

	console.log({ result })

	return { text: result }
}
