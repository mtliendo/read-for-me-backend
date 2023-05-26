import { CreateAudioFromDocumentMutationVariables } from './../API'
import { Context } from '@aws-appsync/utils'

export function request(
	ctx: Context<CreateAudioFromDocumentMutationVariables>
) {
	const preferredSpeakerMap = {
		en: 'Ruth',
		es: 'Mia',
	}

	const selectedVoice = preferredSpeakerMap[ctx.args.input.preferredLanguage]

	return {
		method: 'POST',
		resourcePath: '/v1/synthesisTasks',
		params: {
			headers: {
				'content-type': 'application/x-amz-json-1.1',
				'x-amz-target': 'AWSPolly.StartSpeechSynthesisTask',
			},
			body: {
				Text: ctx.prev.result.text,
				OutputFormat: 'mp3',
				VoiceId: selectedVoice,
				Engine: 'neural',
				OutputS3BucketName: ctx.stash.bucketName,
				OutputS3KeyPrefix: `protected/${ctx.args.input.cognitoIdentityId}/`,
			},
		},
	}
}

export function response(ctx: Context) {
	const result = JSON.parse(ctx.result.body)
	const taskId = result.SynthesisTask.TaskId
	const audioKey = `.${taskId}.mp3`
	return { audioKey }
}
