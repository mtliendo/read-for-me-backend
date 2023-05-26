//! Publishes a JSON object to AppSync. Relies on a schema that contains the following:
/*
type Mutation {
	publish(data: AWSJSON): AWSJSON @aws_iam
}

type Subscription {
	subscribe: AWSJSON @aws_subscribe(mutations: ["publish"])
}
*/

const urlParse = require('url').URL
const fetch = require('node-fetch')
const AWS = require('aws-sdk')

type publishToAppSyncProps = { appsyncUrl: string; region: string; data: any }

const publish = /* GraphQL */ `
	mutation Publish($data: AWSJSON) {
		publish(data: $data)
	}
`
export const publishToAppSync = async ({
	appsyncUrl,
	region,
	data,
}: publishToAppSyncProps) => {
	console.log({
		appsyncUrl,
		region,
		data,
	})
	//same as appsyncUrl but without the "https://"
	const endpoint = new urlParse(appsyncUrl).hostname
	const httpRequest = new AWS.HttpRequest(appsyncUrl, region)
	console.log({ endpoint })
	console.log({ httpRequest })
	httpRequest.headers.host = endpoint
	httpRequest.headers['Content-Type'] = 'application/json'
	httpRequest.method = 'POST'
	const publishToAppSyncBody = {
		query: publish,
		operationName: 'Publish',
		variables: {
			data: JSON.stringify(data),
		},
	}

	httpRequest.body = JSON.stringify(publishToAppSyncBody)

	const signer = new AWS.Signers.V4(httpRequest, 'appsync', true)
	signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate())

	const options = {
		method: httpRequest.method,
		body: httpRequest.body,
		headers: httpRequest.headers,
	}
	const res = await fetch(appsyncUrl, options)
	return res.json()
}
