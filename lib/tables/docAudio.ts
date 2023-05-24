import { Construct } from 'constructs'
import * as awsDynamodb from 'aws-cdk-lib/aws-dynamodb'
import { RemovalPolicy } from 'aws-cdk-lib'

type TableProps = {
	appName: string
}

export function createTable(
	scope: Construct,
	props: TableProps
): awsDynamodb.Table {
	const table = new awsDynamodb.Table(scope, props.appName, {
		tableName: `${props.appName}Table`,
		removalPolicy: RemovalPolicy.DESTROY,
		billingMode: awsDynamodb.BillingMode.PAY_PER_REQUEST,
		partitionKey: { name: 'id', type: awsDynamodb.AttributeType.STRING },
	})

	table.addGlobalSecondaryIndex({
		indexName: 'DocAudioFile-by-owner',
		partitionKey: {
			name: '__typename',
			type: awsDynamodb.AttributeType.STRING,
		},
		sortKey: { name: 'owner', type: awsDynamodb.AttributeType.STRING },
	})

	return table
}
