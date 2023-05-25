import { Context } from '@aws-appsync/utils'

export function request(ctx: Context) {
	return {
		method: 'POST',
		resourcePath: '/',
		params: {
			headers: {
				'content-type': 'application/x-amz-json-1.1',
				'x-amz-target': 'Comprehend_20171127.DetectDominantLanguage',
			},
			body: {
				Text: ctx.prev.result.text,
			},
		},
	}
}

export function response(ctx: Context) {
	const dominantLanguage = JSON.parse(ctx.result.body).Languages[0].LanguageCode
	console.log('dominantLanguage', dominantLanguage)
	return { dominantLanguage, text: ctx.prev.result.text }
}
