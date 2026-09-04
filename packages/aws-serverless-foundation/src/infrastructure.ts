import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cr from "aws-cdk-lib/custom-resources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

const directory = path.dirname(fileURLToPath(import.meta.url));

export function createProtectedSingleTable(scope: Construct, id: string, options: {
  tableName: string;
  partitionKeyName?: string;
  sortKeyName?: string;
  ttlAttributeName?: string;
  stream?: dynamodb.StreamViewType;
}): dynamodb.Table {
  return new dynamodb.Table(scope, id, {
    tableName: options.tableName,
    partitionKey: { name: options.partitionKeyName ?? "pk", type: dynamodb.AttributeType.STRING },
    sortKey: { name: options.sortKeyName ?? "sk", type: dynamodb.AttributeType.STRING },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    encryption: dynamodb.TableEncryption.AWS_MANAGED,
    stream: options.stream ?? dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    timeToLiveAttribute: options.ttlAttributeName ?? "expiresAt",
    pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    deletionProtection: true,
    removalPolicy: cdk.RemovalPolicy.RETAIN,
  });
}
export function createNodeFunction(scope: Construct, id: string, options: {
  functionName: string;
  entry: string;
  handler?: string;
  environment?: Record<string, string>;
  timeout?: cdk.Duration;
  memorySize?: number;
  logRetention?: logs.RetentionDays;
}): lambdaNode.NodejsFunction {
  return new lambdaNode.NodejsFunction(scope, id, {
    functionName: options.functionName,
    entry: options.entry,
    handler: options.handler ?? "handler",
    environment: options.environment,
    runtime: lambda.Runtime.NODEJS_22_X,
    architecture: lambda.Architecture.ARM_64,
    timeout: options.timeout ?? cdk.Duration.seconds(20),
    memorySize: options.memorySize ?? 512,
    tracing: lambda.Tracing.ACTIVE,
    bundling: { minify: true, sourceMap: true, bundleAwsSDK: true },
    logGroup: new logs.LogGroup(scope, `${id}LogGroup`, {
      logGroupName: `/aws/lambda/${options.functionName}`,
      retention: options.logRetention ?? logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    }),
  });
}

export function createReliableQueue(scope: Construct, id: string, options: {
  queueName: string;
  deadLetterQueueName?: string;
  visibilityTimeout?: cdk.Duration;
  retentionPeriod?: cdk.Duration;
  deadLetterRetentionPeriod?: cdk.Duration;
  maxReceiveCount?: number;
}): { queue: sqs.Queue; deadLetterQueue: sqs.Queue } {
  const deadLetterQueue = new sqs.Queue(scope, `${id}DeadLetterQueue`, {
    queueName: options.deadLetterQueueName ?? `${options.queueName}-dlq`,
    retentionPeriod: options.deadLetterRetentionPeriod ?? cdk.Duration.days(14),
    encryption: sqs.QueueEncryption.SQS_MANAGED,
  });
  const queue = new sqs.Queue(scope, id, {
    queueName: options.queueName,
    visibilityTimeout: options.visibilityTimeout ?? cdk.Duration.minutes(2),
    retentionPeriod: options.retentionPeriod ?? cdk.Duration.days(4),
    encryption: sqs.QueueEncryption.SQS_MANAGED,
    deadLetterQueue: {
      queue: deadLetterQueue,
      maxReceiveCount: options.maxReceiveCount ?? 5,
    },
  });
  return { queue, deadLetterQueue };
}

export function createFunctionErrorAlarm(scope: Construct, id: string, options: {
  function: lambda.IFunction;
  alarmName: string;
  threshold?: number;
  evaluationPeriods?: number;
  period?: cdk.Duration;
}): cloudwatch.Alarm {
  return new cloudwatch.Alarm(scope, id, {
    alarmName: options.alarmName,
    metric: options.function.metricErrors({ period: options.period ?? cdk.Duration.minutes(5) }),
    threshold: options.threshold ?? 3,
    evaluationPeriods: options.evaluationPeriods ?? 1,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  });
}

export function createStaticSpa(scope: Construct, id: string, options: {
  namePrefix: string;
  assetPath: string;
  extensionlessRouteExclusions?: string[];
  contentSecurityPolicy?: string;
}): { bucket: s3.Bucket; distribution: cloudfront.Distribution; publicOrigin: string } {
  const bucket = new s3.Bucket(scope, `${id}Bucket`, {
    bucketName: `${options.namePrefix}-website-${cdk.Aws.ACCOUNT_ID}`,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    enforceSSL: true,
    encryption: s3.BucketEncryption.S3_MANAGED,
    removalPolicy: cdk.RemovalPolicy.RETAIN,
    autoDeleteObjects: false,
  });
  const responseHeaders = new cloudfront.ResponseHeadersPolicy(scope, `${id}SecurityHeaders`, {
    responseHeadersPolicyName: `${options.namePrefix}-website-security`,
    securityHeadersBehavior: {
      contentSecurityPolicy: {
        contentSecurityPolicy: options.contentSecurityPolicy ?? "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
        override: true,
      },
      contentTypeOptions: { override: true },
      frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
      referrerPolicy: { referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER, override: true },
      strictTransportSecurity: {
        accessControlMaxAge: cdk.Duration.days(365),
        includeSubdomains: true,
        preload: true,
        override: true,
      },
    },
  });
  const exclusions = options.extensionlessRouteExclusions ?? [];
  const exclusionExpression = exclusions.length
    ? ` && !(${exclusions.map((prefix) => `request.uri.indexOf(${JSON.stringify(prefix)}) === 0`).join(" || ")})`
    : "";
  const cleanRouteRewrite = new cloudfront.Function(scope, `${id}CleanRouteRewrite`, {
    functionName: `${options.namePrefix}-clean-route-rewrite`,
    code: cloudfront.FunctionCode.fromInline(`function handler(event) {
  var request = event.request;
  if (request.method === "GET" && request.uri.indexOf(".") < 0${exclusionExpression}) request.uri = "/index.html";
  return request;
}`),
  });
  const distribution = new cloudfront.Distribution(scope, `${id}Distribution`, {
    defaultRootObject: "index.html",
    defaultBehavior: {
      origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      responseHeadersPolicy: responseHeaders,
      functionAssociations: [{ function: cleanRouteRewrite, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST }],
    },
  });
  new s3deploy.BucketDeployment(scope, `${id}Deployment`, {
    sources: [s3deploy.Source.asset(options.assetPath)],
    destinationBucket: bucket,
    distribution,
    distributionPaths: ["/*"],
  });
  return { bucket, distribution, publicOrigin: `https://${distribution.distributionDomainName}` };
}

export function createDynamoVectorIndex(scope: Construct, id: string, options: {
  table: dynamodb.Table;
  functionNamePrefix: string;
  indexName: string;
  dimensions: number;
  vectorAttributeName: string;
  searchSchema: Array<{
    attributeName: string;
    attributeType: "S" | "N" | "B";
    elementType: "HASH" | "INLINE_FILTER";
  }>;
  projectionAttributes?: string[];
}): cdk.CustomResource {
  const entry = path.join(directory, "vector-index-handler.ts");
  const onEvent = createNodeFunction(scope, `${id}OnEvent`, {
    functionName: `${options.functionNamePrefix}-vector-index-on-event`,
    entry,
    handler: "onEvent",
    timeout: cdk.Duration.minutes(2),
  });
  const isComplete = createNodeFunction(scope, `${id}IsComplete`, {
    functionName: `${options.functionNamePrefix}-vector-index-is-complete`,
    entry,
    handler: "isComplete",
    timeout: cdk.Duration.minutes(2),
  });
  for (const providerFunction of [onEvent, isComplete]) {
    providerFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ["dynamodb:DescribeTable", "dynamodb:UpdateTable"],
      resources: [options.table.tableArn],
    }));
  }
  const provider = new cr.Provider(scope, `${id}Provider`, {
    onEventHandler: onEvent,
    isCompleteHandler: isComplete,
    queryInterval: cdk.Duration.seconds(30),
    totalTimeout: cdk.Duration.hours(2),
  });
  const framework = provider.node.findChild("framework-onEvent") as lambda.Function;
  framework.addToRolePolicy(new iam.PolicyStatement({
    actions: ["lambda:GetFunction", "lambda:InvokeFunction"],
    resources: [onEvent.functionArn, isComplete.functionArn],
  }));
  const resource = new cdk.CustomResource(scope, id, {
    serviceToken: provider.serviceToken,
    properties: {
      TableName: options.table.tableName,
      IndexName: options.indexName,
      Dimensions: options.dimensions,
      VectorAttributeName: options.vectorAttributeName,
      SearchSchema: options.searchSchema.map((entry) => ({
        AttributeName: entry.attributeName,
        AttributeType: entry.attributeType,
        SearchSchemaElementType: entry.elementType,
      })),
      ProjectionAttributes: options.projectionAttributes,
    },
  });
  resource.node.addDependency(options.table);
  const providerPolicy = framework.role?.node.tryFindChild("DefaultPolicy");
  if (providerPolicy) resource.node.addDependency(providerPolicy);
  return resource;
}

export function createTaggedMonthlyBudget(scope: Construct, id: string, options: {
  budgetName: string;
  monthlyLimitUsd: number;
  alertEmail: string;
  tagKey: string;
  tagValue: string;
}): budgets.CfnBudget {
  return new budgets.CfnBudget(scope, id, {
    budget: {
      budgetName: options.budgetName,
      budgetType: "COST",
      timeUnit: "MONTHLY",
      budgetLimit: { amount: options.monthlyLimitUsd, unit: "USD" },
      costFilters: { TagKeyValue: [`user:${options.tagKey}$${options.tagValue}`] },
    },
    notificationsWithSubscribers: [80, 100].map((threshold) => ({
      notification: {
        comparisonOperator: "GREATER_THAN",
        notificationType: "FORECASTED",
        threshold,
        thresholdType: "PERCENTAGE",
      },
      subscribers: [{ subscriptionType: "EMAIL", address: options.alertEmail }],
    })),
  });
}
