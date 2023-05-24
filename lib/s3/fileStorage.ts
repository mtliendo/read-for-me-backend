import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as awsCloudfront from 'aws-cdk-lib/aws-cloudfront'
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'

type CreateDocAudioBucketProps = {
	appName: string
	authenticatedRole: iam.IRole
}

export function createDocAudioBucket(
	scope: Construct,
	props: CreateDocAudioBucketProps
) {
	const fileStorageBucket = new s3.Bucket(scope, `${props.appName}-bucket`, {
		cors: [
			{
				allowedMethods: [
					s3.HttpMethods.GET,
					s3.HttpMethods.POST,
					s3.HttpMethods.PUT,
					s3.HttpMethods.DELETE,
				],
				allowedOrigins: ['*'],
				allowedHeaders: ['*'],
				exposedHeaders: [
					'x-amz-server-side-encryption',
					'x-amz-request-id',
					'x-amz-id-2',
					'ETag',
				],
			},
		],
	})

	// Create a CloudFront distribution to serve the bucket (not used in this app)
	const fileStorageBucketCFDistribution = new awsCloudfront.Distribution(
		scope,
		`${props.appName}-CDN`,
		{
			defaultBehavior: {
				origin: new S3Origin(fileStorageBucket, { originPath: '/public' }),
				cachePolicy: awsCloudfront.CachePolicy.CACHING_OPTIMIZED,
				allowedMethods: awsCloudfront.AllowedMethods.ALLOW_GET_HEAD,
				cachedMethods: awsCloudfront.AllowedMethods.ALLOW_GET_HEAD,
				viewerProtocolPolicy:
					awsCloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
			},
		}
	)

	// Let signed in users CRUD on a bucket
	const canReadUpdateDeleteFromOwnProtectedDirectory = new iam.PolicyStatement({
		effect: iam.Effect.ALLOW,
		actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
		resources: [
			`arn:aws:s3:::${fileStorageBucket.bucketName}/protected/\${cognito-identity.amazonaws.com:sub}/*`,
		],
	})
	const allowTextractToReadProtectedDirectory = new iam.PolicyStatement({
		effect: iam.Effect.ALLOW,
		principals: [new iam.ServicePrincipal('textract.amazonaws.com')],
		actions: ['s3:GetObject'],
		resources: [`arn:aws:s3:::${fileStorageBucket.bucketName}/protected/*`],
	})

	fileStorageBucket.addToResourcePolicy(allowTextractToReadProtectedDirectory)

	new iam.ManagedPolicy(scope, 'SignedInUserManagedPolicy', {
		description:
			'managed Policy to allow access to s3 bucket by signed in users.',
		statements: [canReadUpdateDeleteFromOwnProtectedDirectory],
		roles: [props.authenticatedRole],
	})

	return { fileStorageBucket, fileStorageBucketCFDistribution }
}
