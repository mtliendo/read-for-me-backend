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
	bucketARN: string
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

	//* Begin: Setup access for HTTP function to call Textract
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

	const allowToGetObjectFromS3 = new PolicyStatement({
		actions: ['s3:GetObject'],
		resources: [`${props.bucketARN}/protected/*`],
	})

	textractDataSource.grantPrincipal.addToPrincipalPolicy(allowTextractAccess)
	textractDataSource.grantPrincipal.addToPrincipalPolicy(allowToGetObjectFromS3)

	//* End: Setup access for HTTP function to call Textract

	//* Begin: Setup access for HTTP function to call Comprehend
	const comprehendDatasource = api.addHttpDataSource(
		'comprehendDatasource',
		'https://comprehend.us-east-1.amazonaws.com',
		{
			authorizationConfig: {
				signingRegion: process.env.CDK_DEFAULT_REGION!,
				signingServiceName: 'comprehend',
			},
		}
	)

	const allowComprehendAccess = new PolicyStatement({
		actions: ['comprehend:DetectDominantLanguage'],
		resources: [`*`],
	})

	comprehendDatasource.grantPrincipal.addToPrincipalPolicy(
		allowComprehendAccess
	)
	//* End: Setup access for HTTP function to call Comprehend
	//* Begin: Setup access for HTTP function to call Comprehend
	const translateDatasource = api.addHttpDataSource(
		'translateDatasource',
		'https://translate.us-east-1.amazonaws.com',
		{
			authorizationConfig: {
				signingRegion: process.env.CDK_DEFAULT_REGION!,
				signingServiceName: 'translate',
			},
		}
	)

	const allowTranslateAccess = new PolicyStatement({
		actions: ['translate:DetectDominantLanguage'],
		resources: [`*`],
	})

	translateDatasource.grantPrincipal.addToPrincipalPolicy(allowTranslateAccess)
	//* End: Setup access for HTTP function to call translate

	//Todo: add fucntion for tanslate and put in pipeline

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

	const detectDominantLanguageFunction = new awsAppsync.AppsyncFunction(
		scope,
		'detectDominantLanguageFunction',
		{
			name: 'detectDominantLanguageFunction',
			api,
			dataSource: comprehendDatasource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(
					__dirname,
					'graphql/JS_functions/Mutation.detectDominantLanguage.js'
				)
			),
		}
	)

	const translateTextFunction = new awsAppsync.AppsyncFunction(
		scope,
		'translateTextFunction',
		{
			name: 'translateTextFunction',
			api,
			dataSource: comprehendDatasource,
			runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
			code: awsAppsync.Code.fromAsset(
				path.join(__dirname, 'graphql/JS_functions/Mutation.translateText.js')
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
		export function request(ctx) {
			console.log(ctx.args)

			return {}
		}

		export function response(ctx) {
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
		export function request(ctx) {
			console.log(ctx.args)
			ctx.stash.bucketName = '${props.bucketName}'
			return {}
		}

		export function response(ctx) {
			return ctx.prev.result
		}`),
		runtime: awsAppsync.FunctionRuntime.JS_1_0_0,
		pipelineConfig: [
			detectDocumentTextFunction,
			detectDominantLanguageFunction,
			translateTextFunction,
			createSaveDocAudioFunction,
		],
	})

	return api
}
