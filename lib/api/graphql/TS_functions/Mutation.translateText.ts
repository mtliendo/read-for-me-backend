import { Context, runtime } from '@aws-appsync/utils'

export function request(ctx: Context) {
	//if user preferred language is the document language,
	// then don't translate, if the user preferred language is not the same as the document language, then translate to user preferred language.
	if (ctx.args.input.preferredLanguage === ctx.prev.result.dominantLanguage) {
		runtime.earlyReturn({ text: ctx.prev.result.text })
	} else {
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
					TargetLanguageCode: ctx.args.input.preferredLanguage,
				},
			},
		}
	}
}

export function response(ctx: Context) {
	const translatedText = JSON.parse(ctx.result.body).TranslatedText
	console.log('translatedText', translatedText)
	return { text: translatedText }
}
