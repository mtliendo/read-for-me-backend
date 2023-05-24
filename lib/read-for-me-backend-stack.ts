import * as cdk from 'aws-cdk-lib'
import { CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { createTable } from './tables/docAudio'
import { createAPI } from './api/appsync'
import { createAuth } from './cognito/auth'
import { createDocAudioBucket } from './s3/fileStorage'

export class ReadForMeBackendStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props)
		const appName = 'readForMeAppSync'

		const DocAudioTable = createTable(this, {
			appName,
		})

		const DocAudioAuth = createAuth(this, {
			appName,
		})

		const DocAudioBucket = createDocAudioBucket(this, {
			appName,
			authenticatedRole: DocAudioAuth.identityPool.authenticatedRole,
		})

		const appsyncAPI = createAPI(this, {
			appName,
			bucketName: DocAudioBucket.fileStorageBucket.bucketName,
			docAudioTable: DocAudioTable,
			userpool: DocAudioAuth.userPool,
			unauthenticatedRole: DocAudioAuth.identityPool.unauthenticatedRole,
		})

		new CfnOutput(this, 'cognitoUserPoolId', {
			value: DocAudioAuth.userPool.userPoolId,
		})
		new CfnOutput(this, 'idenititypoolId', {
			value: DocAudioAuth.identityPool.identityPoolId,
		})

		new CfnOutput(this, 'cognitoUserPoolClientId', {
			value: DocAudioAuth.userPoolClient.userPoolClientId,
		})

		new CfnOutput(this, 'region', {
			value: this.region,
		})

		new CfnOutput(this, 'AppSyncURL', {
			value: appsyncAPI.graphqlUrl,
		})
	}
}
