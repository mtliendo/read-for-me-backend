import { Construct } from 'constructs'
import * as awsAppsync from 'aws-cdk-lib/aws-appsync'
import * as path from 'path'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam'

type AppSyncAPIProps = {
	appName: string
	unauthenticatedRole: IRole
	userpool: UserPool
	bucketName: string
	docAudioTable: Table
}

export function createAPI(scope: Construct, props: AppSyncAPIProps) {
	const api = new awsAppsync.GraphqlApi(scope, `${props.appName}API`, {
		name: `${props.appName}API`,
		schema: awsAppsync.SchemaFile.fromAsset(
			path.join(__dirname, './graphql/schema.graphql')
		),
		authorizationConfig: {
			defaultAuthorization: {
				authorizationType: awsAppsync.AuthorizationType.USER_POOL,
				userPoolConfig: {
					userPool: props.userpool,
				},
			},
		},
		xrayEnabled: true,
		logConfig: {
			fieldLogLevel: awsAppsync.FieldLogLevel.ALL,
		},
	})

	const docAudioTableDataSource = api.addDynamoDbDataSource(
		`docAudioTableDataSource`,
		props.docAudioTable
	)

	const textractDataSource = api.addHttpDataSource(
		'textractDataSource',
		'https://textract.us-east-1.amazonaws.com',
		{
			authorizationConfig: {
				signingRegion: process.env.CDK_DEFAULT_REGION!,
				signingServiceName: 'textract',
			},
		}
	)

	const allowTextractAccess = new PolicyStatement({
		actions: ['textract:DetectDocumentText'],
		resources: [`*`],
	})

	textractDataSource.grantPrincipal.addToPrincipalPolicy(allowTextractAccess)

	const listDocAudioFunction = new awsAppsync.AppsyncFunction(
		scope,
		'listDocAudioFunction',
		{
			name: 'listDocAudioFunction',
			api,
			dataSource: docAudioTableDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/JS_functions/Query.listDocAudioFiles.js')
			),
		}
	)

	const detectDocumentTextFunction = new awsAppsync.AppsyncFunction(
		scope,
		'detectDocumentTextFunction',
		{
			name: 'detectDocumentTextFunction',
			api,
			dataSource: textractDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(
					__dirname,
					'graphql/JS_functions/Mutation.detectDocumentText.js'
				)
			),
		}
	)

	const createSaveDocAudioFunction = new awsAppsync.AppsyncFunction(
		scope,
		'createSaveDocAudioFunction',
		{
			name: 'createSaveDocAudioFunction',
			api,
			dataSource: docAudioTableDataSource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/JS_functions/Mutation.saveDocAudio.js')
			),
		}
	)

	new awsAppsync.Resolver(scope, 'listAudioFilesResolver', {
		api,
		typeName: 'Query',
		fieldName: 'listAudioFiles',
		code: awsAppsync.Code.fromInline(`
		import { Context } from '@aws-appsync/utils'

		export function request(ctx: Context) {
			console.log(ctx.args)

			return {}
		}

		export function response(ctx: Context) {
			return ctx.prev.result
		}`),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [listDocAudioFunction],
	})

	new awsAppsync.Resolver(scope, 'createAudioFromDocumentResolver', {
		api,
		typeName: 'Mutation',
		fieldName: 'createAudioFromDocument',
		code: awsAppsync.Code.fromInline(`
		import { Context } from '@aws-appsync/utils'

		export function request(ctx: Context) {
			console.log(ctx.args)
			ctx.stash.bucketName = '${props.bucketName}'
			return {}
		}

		export function response(ctx: Context) {
			return ctx.prev.result
		}`),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [detectDocumentTextFunction, createSaveDocAudioFunction],
	})

	return api
}
