import * as cdk from 'aws-cdk-lib'
import { CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { createTable } from './tables/docAudio'
import { createAPI } from './api/appsync'
import { createAuth } from './cognito/auth'
import { createDocAudioBucket } from './s3/fileStorage'
import { createPublishToAppSyncFunc } from './functions/publishToAppSync/construct'
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam'

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

		const s3LambdaTrigger = createPublishToAppSyncFunc(this, {
			appName,
		})

		s3LambdaTrigger.grantInvoke(new ServicePrincipal('s3.amazonaws.com'))

		const DocAudioBucket = createDocAudioBucket(this, {
			appName,
			s3LambdaTrigger: s3LambdaTrigger,
			authenticatedRole: DocAudioAuth.identityPool.authenticatedRole,
		})

		const appsyncAPI = createAPI(this, {
			appName,
			bucketName: DocAudioBucket.fileStorageBucket.bucketName,
			bucketARN: DocAudioBucket.fileStorageBucket.bucketArn,
			docAudioTable: DocAudioTable,
			userpool: DocAudioAuth.userPool,
			unauthenticatedRole: DocAudioAuth.identityPool.unauthenticatedRole,
		})

		appsyncAPI.grantMutation(s3LambdaTrigger, 'publish')

		s3LambdaTrigger.addEnvironment('APPSYNC_URL', appsyncAPI.graphqlUrl)

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
