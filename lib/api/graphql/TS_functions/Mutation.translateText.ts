import { Context } from '@aws-appsync/utils'

export function request(ctx: Context) {
	//if user preferred language is not the document language,
	// then translate, if the user preferred language is the same as the document language, then return from this function pass along the previous result.
	return {
		method: 'POST',
		resourcePath: '/',
		params: {
			headers: {
				'content-type': 'application/x-amz-json-1.1',
				'x-amz-target': 'AWSShineFrontendService_20170701.TranslateText',
			},
			body: {
				Text: ctx.prev.result.text,
				SourceLanguageCode: ctx.prev.result.dominantLanguage,
				TargetLanguageCode: 'en',
			},
		},
	}
}

export function response(ctx: Context) {
	const translatedText = JSON.parse(ctx.result.body).TranslatedText
	console.log('translatedText', translatedText)
	return { translatedText }
}
