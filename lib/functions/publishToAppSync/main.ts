import { publishToAppSync } from './publishJSONToAppSync'

type RecordEvent = { s3: { bucket: { name: string }; object: { key: string } } }

type S3TriggerEvent = {
	Records: RecordEvent[]
}

exports.handler = async (event: S3TriggerEvent) => {
	console.log('the event STRING', JSON.stringify(event.Records))
	console.log('the event DATA', event.Records)
	const appsyncUrl = process.env.APPSYNC_URL!
	const region = process.env.REGION!

	for (const record of event.Records) {
		const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
		try {
			console.log('in the try block')
			const publishedData = await publishToAppSync({
				appsyncUrl,
				region,
				data: { audioKey: key },
			})
			console.log('publishedData', publishedData)
			return {
				statusCode: 200,
				body: publishedData,
			}
		} catch (e) {
			console.log({ error: e })
			return { statusCode: 404, body: { error: e } }
		}
	}
	return {
		statusCode: 200,
		body: 'success',
	}
}
