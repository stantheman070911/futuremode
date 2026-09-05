import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as cr from "aws-cdk-lib/custom-resources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as eventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as scheduler from "aws-cdk-lib/aws-scheduler";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

const directory = path.dirname(fileURLToPath(import.meta.url));

export interface PitchYourOwnerCloudStackProps extends cdk.StackProps {
  environment: string;
}

export class PitchYourOwnerCloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PitchYourOwnerCloudStackProps) {
    super(scope, id, props);

    const environment = props.environment;
    const prefix = `pitchyourowner-${environment}`;
    const embeddingModelId = String(this.node.tryGetContext("embeddingModelId") ?? "global.cohere.embed-v4:0");
    const embeddingFoundationModelId = embeddingModelId.replace(/^(global|us|eu|apac)\./, "");
    const matchJudgeModelId = String(this.node.tryGetContext("matchJudgeModelId") ?? "apac.amazon.nova-pro-v1:0");
    const matchJudgeFoundationModelId = matchJudgeModelId.replace(/^(global|us|eu|apac)\./, "");
    const geminiImageModelId = String(this.node.tryGetContext("geminiImageModelId") ?? "gemini-3.1-flash-lite-image");
    const geminiImageReviewModelId = String(this.node.tryGetContext("geminiImageReviewModelId") ?? "gemini-3.5-flash-lite");
    const embeddingDimensions = Number(this.node.tryGetContext("embeddingDimensions") ?? 1_024);
    const verificationEmailEnabled = String(this.node.tryGetContext("verificationEmailEnabled") ?? "true") === "true";
    const matchingEmailDeliveryEnabled = String(this.node.tryGetContext("matchingEmailDeliveryEnabled") ?? "false") === "true";
    const emailProvider = String(this.node.tryGetContext("emailProvider") ?? "resend").trim().toLowerCase();
    if (!["ses", "resend"].includes(emailProvider)) throw new Error("emailProvider must be ses or resend");
    const vectorIndexName = "profile-matching-v1";
    const monthlyBudgetUsd = Number(this.node.tryGetContext("monthlyBudgetUsd") ?? 100);

    const senderEmail = new cdk.CfnParameter(this, "SenderEmail", {
      type: "String",
      description: "Verified sender used for PitchYourOwner email",
      allowedPattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    });
    const resendApiKey = new cdk.CfnParameter(this, "ResendApiKey", {
      type: "String",
      description: "Resend API key used when emailProvider=resend",
      noEcho: true,
    });
    const operationsAlertEmail = new cdk.CfnParameter(this, "OperationsAlertEmail", {
      type: "String",
      description: "Address for deployment and runtime alerts",
      allowedPattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    });

    cdk.Tags.of(this).add("Project", "PitchYourOwner");
    cdk.Tags.of(this).add("Environment", environment);
    cdk.Tags.of(this).add("ManagedBy", "AWS-CDK");

    const operationsTopic = new sns.Topic(this, "OperationsTopic", {
      topicName: `${prefix}-operations-alerts`,
      displayName: "PitchYourOwner operations",
      masterKey: kms.Alias.fromAliasName(this, "AwsManagedSnsKey", "alias/aws/sns"),
    });
    operationsTopic.addSubscription(new snsSubscriptions.EmailSubscription(operationsAlertEmail.valueAsString));

    new budgets.CfnBudget(this, "MonthlyCostBudget", {
      budget: {
        budgetName: `${prefix}-monthly-cost`,
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: { amount: monthlyBudgetUsd, unit: "USD" },
        costFilters: { TagKeyValue: ["user:Project$PitchYourOwner"] },
      },
      notificationsWithSubscribers: [80, 100].map((threshold) => ({
        notification: {
          comparisonOperator: "GREATER_THAN",
          notificationType: "FORECASTED",
          threshold,
          thresholdType: "PERCENTAGE",
        },
        subscribers: [{ subscriptionType: "EMAIL", address: operationsAlertEmail.valueAsString }],
      })),
    });

    const table = new dynamodb.Table(this, "ProfileStore", {
      tableName: `${prefix}-profile-store`,
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: "expiresAt",
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const lambdaDefaults: Omit<lambdaNode.NodejsFunctionProps, "entry"> = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(20),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      bundling: { minify: true, sourceMap: true, bundleAwsSDK: true },
    };
    const functionFor = (name: string, entry: string, extra: Partial<lambdaNode.NodejsFunctionProps> = {}) => {
      const functionName = `${prefix}-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, "")}`;
      return new lambdaNode.NodejsFunction(this, name, {
        ...lambdaDefaults,
        ...extra,
        functionName,
        entry: path.join(directory, "..", "functions", entry, "index.ts"),
        handler: extra.handler ?? "handler",
        logGroup: new logs.LogGroup(this, `${name}LogGroup`, {
          logGroupName: `/aws/lambda/${functionName}`,
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        environment: { TABLE_NAME: table.tableName, ...extra.environment },
      });
    };

    const vectorOnEvent = functionFor("VectorIndexOnEvent", "vector-index-provider", {
      handler: "onEvent",
      timeout: cdk.Duration.minutes(2),
    });
    const vectorIsComplete = functionFor("VectorIndexIsComplete", "vector-index-provider", {
      handler: "isComplete",
      timeout: cdk.Duration.minutes(2),
    });
    for (const providerFunction of [vectorOnEvent, vectorIsComplete]) {
      providerFunction.addToRolePolicy(new iam.PolicyStatement({
        actions: ["dynamodb:DescribeTable", "dynamodb:UpdateTable"],
        resources: [table.tableArn],
      }));
    }
    const vectorProvider = new cr.Provider(this, "VectorIndexProvider", {
      onEventHandler: vectorOnEvent,
      isCompleteHandler: vectorIsComplete,
      queryInterval: cdk.Duration.seconds(30),
      totalTimeout: cdk.Duration.hours(2),
    });
    // The CDK provider framework checks named user Lambdas with GetFunction
    // before invocation. Make the permission explicit and, critically, force
    // the custom resource to wait for the inline policy to be attached. Without
    // this dependency CloudFormation can invoke the provider while IAM still
    // reports a transient 403 during first-stack creation.
    const vectorProviderFramework = vectorProvider.node.findChild("framework-onEvent") as lambda.Function;
    vectorProviderFramework.addToRolePolicy(new iam.PolicyStatement({
      actions: ["lambda:GetFunction", "lambda:InvokeFunction"],
      resources: [vectorOnEvent.functionArn, vectorIsComplete.functionArn],
    }));
    const vectorIndex = new cdk.CustomResource(this, "ProfileVectorIndex", {
      serviceToken: vectorProvider.serviceToken,
      properties: { TableName: table.tableName, IndexName: vectorIndexName, Dimensions: embeddingDimensions },
    });
    vectorIndex.node.addDependency(table);
    const vectorProviderPolicy = vectorProviderFramework.role?.node.tryFindChild("DefaultPolicy");
    if (vectorProviderPolicy) vectorIndex.node.addDependency(vectorProviderPolicy);

    const websiteBucket = new s3.Bucket(this, "CloudWebsiteBucket", {
      bucketName: `${prefix}-website-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });
    const profileImageBucket = new s3.Bucket(this, "ProfileImageBucket", {
      bucketName: `${prefix}-profile-images-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      lifecycleRules: [{ abortIncompleteMultipartUploadAfter: cdk.Duration.days(1) }],
    });
    const geminiImageSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "GeminiImageApiKey",
      `pitchyourowner/${environment}/gemini-image-api-key`,
    );
    const responseHeaders = new cloudfront.ResponseHeadersPolicy(this, "CloudWebsiteSecurityHeaders", {
      responseHeadersPolicyName: `${prefix}-website-security`,
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          contentSecurityPolicy: "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
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
    const cleanRouteRewrite = new cloudfront.Function(this, "CleanRouteRewrite", {
      functionName: `${prefix}-clean-route-rewrite`,
      code: cloudfront.FunctionCode.fromInline(`function handler(event) {
  var request = event.request;
  if (request.method === "GET" && request.uri.indexOf("/v1/") !== 0 && request.uri.indexOf(".") < 0) request.uri = "/index.html";
  return request;
}`),
    });
    const distribution = new cloudfront.Distribution(this, "CloudWebsiteDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: responseHeaders,
        functionAssociations: [{ function: cleanRouteRewrite, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST }],
      },
    });
    const publicSiteOrigin = `https://${distribution.distributionDomainName}`;

    const outboxDlq = new sqs.Queue(this, "EmailOutboxDlq", {
      queueName: `${prefix}-email-outbox-dlq`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });
    const outboxQueue = new sqs.Queue(this, "EmailOutboxQueue", {
      queueName: `${prefix}-email-outbox`,
      visibilityTimeout: cdk.Duration.minutes(2),
      retentionPeriod: cdk.Duration.days(4),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: { queue: outboxDlq, maxReceiveCount: 5 },
    });

    const requestVerification = functionFor("VerificationRequest", "verification-request", {
      environment: {
        EMAIL_PROVIDER: emailProvider,
        EMAIL_SENDER: senderEmail.valueAsString,
        SES_SENDER: senderEmail.valueAsString,
        RESEND_API_KEY: resendApiKey.valueAsString,
        EMAIL_DELIVERY_ENABLED: String(verificationEmailEnabled),
        VERIFICATION_COOLDOWN_SECONDS: String(this.node.tryGetContext("verificationCooldownSeconds") ?? 60),
        VERIFICATION_EMAIL_HOURLY_LIMIT: String(this.node.tryGetContext("verificationEmailHourlyLimit") ?? 5),
        VERIFICATION_IP_HOURLY_LIMIT: String(this.node.tryGetContext("verificationIpHourlyLimit") ?? 20),
        PUBLIC_SITE_ORIGIN: publicSiteOrigin,
      },
    });
    const confirmVerification = functionFor("VerificationConfirm", "verification-confirm");
    const publishProfile = functionFor("ProfilePublish", "profile-publish", {
      timeout: cdk.Duration.seconds(60),
      memorySize: 1_024,
      environment: {
        EMBEDDING_MODEL_ID: embeddingModelId,
        EMBEDDING_DIMENSIONS: String(embeddingDimensions),
      },
    });
    const accessProfile = functionFor("ProfileAccess", "profile-access", {
      environment: { PUBLIC_SITE_ORIGIN: publicSiteOrigin },
    });
    const publicProfile = functionFor("PublicProfile", "public-profile", {
      environment: { PUBLIC_SITE_ORIGIN: publicSiteOrigin },
    });
    const profileOgImage = functionFor("ProfileOgImage", "profile-og-image", {
      timeout: cdk.Duration.seconds(30),
      memorySize: 1_024,
      bundling: {
        minify: true,
        sourceMap: true,
        bundleAwsSDK: true,
        nodeModules: ["@resvg/resvg-wasm"],
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_inputDir, outputDir) => [
            `cp "${path.join(directory, "..", "assets", "fonts", "noto-sans-cjk-tc-bold.otf")}" "${outputDir}/og-font.otf"`,
          ],
        },
      },
      environment: { PUBLIC_SITE_ORIGIN: publicSiteOrigin, PROFILE_IMAGE_BUCKET_NAME: profileImageBucket.bucketName },
    });
    const profileImageWorker = functionFor("ProfileImageWorker", "profile-image-worker", {
      timeout: cdk.Duration.minutes(2),
      memorySize: 1_536,
      bundling: {
        minify: true,
        sourceMap: true,
        bundleAwsSDK: true,
        nodeModules: ["sharp"],
        // Local CDK bundling must install the native dependency for Lambda rather
        // than for the developer workstation. The stack's shared Lambda default is
        // ARM_64, so these npm selectors intentionally mirror that target.
        environment: {
          npm_config_os: "linux",
          npm_config_cpu: "arm64",
          npm_config_libc: "glibc",
        },
      },
      environment: {
        GEMINI_IMAGE_MODEL_ID: geminiImageModelId,
        GEMINI_IMAGE_REVIEW_MODEL_ID: geminiImageReviewModelId,
        GEMINI_IMAGE_SECRET_ARN: geminiImageSecret.secretArn,
        PROFILE_IMAGE_BUCKET_NAME: profileImageBucket.bucketName,
      },
    });
    const profileImage = functionFor("ProfileImage", "profile-image", {
      environment: { PROFILE_IMAGE_BUCKET_NAME: profileImageBucket.bucketName },
    });
    const profileDrafts = functionFor("ProfileDrafts", "profile-drafts", {
      environment: { PUBLIC_SITE_ORIGIN: publicSiteOrigin },
    });
    const pairing = functionFor("Pairing", "pairing", { environment: { PUBLIC_SITE_ORIGIN: publicSiteOrigin } });
    const runMatching = functionFor("MatchingRun", "matching-run", {
      timeout: cdk.Duration.minutes(10),
      memorySize: 1_024,
      environment: {
        VECTOR_INDEX_NAME: vectorIndexName,
        PUBLIC_SITE_ORIGIN: publicSiteOrigin,
        ENVIRONMENT: environment,
        MATCH_JUDGE_MODEL_ID: matchJudgeModelId,
        MATCH_JUDGE_MIN_MUTUAL_SCORE: String(this.node.tryGetContext("matchJudgeMinMutualScore") ?? 70),
      },
    });
    const triggerMatching = functionFor("MatchingTrigger", "matching-trigger", {
      environment: { MATCHING_RUN_FUNCTION_NAME: runMatching.functionName },
    });
    const relayOutbox = functionFor("OutboxRelay", "outbox-relay", {
      environment: { OUTBOX_QUEUE_URL: outboxQueue.queueUrl },
    });
    const dispatchEmail = functionFor("EmailDispatch", "email-dispatch", {
      environment: {
        EMAIL_PROVIDER: emailProvider,
        EMAIL_SENDER: senderEmail.valueAsString,
        SES_SENDER: senderEmail.valueAsString,
        RESEND_API_KEY: resendApiKey.valueAsString,
      },
    });
    const supportRequest = functionFor("SupportRequest", "support-request", {
      environment: { OPERATIONS_TOPIC_ARN: operationsTopic.topicArn },
    });

    for (const fn of [requestVerification, confirmVerification, publishProfile, accessProfile, profileDrafts, pairing, runMatching, dispatchEmail]) {
      table.grantReadWriteData(fn);
    }
    table.grantReadData(publicProfile);
    table.grantReadData(profileOgImage);
    table.grantReadWriteData(profileImageWorker);
    table.grantReadData(profileImage);
    table.grantStreamRead(profileImageWorker);
    profileImageBucket.grantReadWrite(profileImageWorker);
    profileImageBucket.grantRead(profileImage);
    profileImageBucket.grantRead(profileOgImage);
    geminiImageSecret.grantRead(profileImageWorker);
    table.grant(supportRequest, "dynamodb:PutItem", "dynamodb:UpdateItem");
    table.grantStreamRead(relayOutbox);
    outboxQueue.grantSendMessages(relayOutbox);
    outboxQueue.grantConsumeMessages(dispatchEmail);
    operationsTopic.grantPublish(supportRequest);
    requestVerification.addToRolePolicy(new iam.PolicyStatement({ actions: ["ses:SendEmail"], resources: ["*"] }));
    dispatchEmail.addToRolePolicy(new iam.PolicyStatement({ actions: ["ses:SendEmail"], resources: ["*"] }));
    publishProfile.addToRolePolicy(new iam.PolicyStatement({
      actions: ["bedrock:InvokeModel"],
      resources: [
        `arn:${cdk.Aws.PARTITION}:bedrock:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:inference-profile/${embeddingModelId}`,
        `arn:${cdk.Aws.PARTITION}:bedrock:*::foundation-model/${embeddingFoundationModelId}`,
      ],
    }));
    runMatching.addToRolePolicy(new iam.PolicyStatement({
      actions: ["dynamodb:SearchVectors"],
      resources: [table.tableArn, `${table.tableArn}/index/${vectorIndexName}`],
    }));
    runMatching.addToRolePolicy(new iam.PolicyStatement({
      actions: ["bedrock:InvokeModel"],
      resources: [
        `arn:${cdk.Aws.PARTITION}:bedrock:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:inference-profile/${matchJudgeModelId}`,
        `arn:${cdk.Aws.PARTITION}:bedrock:*::foundation-model/${matchJudgeFoundationModelId}`,
      ],
    }));
    runMatching.node.addDependency(vectorIndex);
    runMatching.grantInvoke(triggerMatching);
    table.grant(triggerMatching, "dynamodb:GetItem");

    relayOutbox.addEventSource(new eventSources.DynamoEventSource(table, {
      enabled: matchingEmailDeliveryEnabled,
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10,
      bisectBatchOnError: true,
      retryAttempts: 5,
    }));
    profileImageWorker.addEventSource(new eventSources.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 10,
      bisectBatchOnError: true,
      retryAttempts: 2,
      maxBatchingWindow: cdk.Duration.seconds(2),
    }));
    dispatchEmail.addEventSource(new eventSources.SqsEventSource(outboxQueue, {
      enabled: matchingEmailDeliveryEnabled,
      batchSize: 5,
      reportBatchItemFailures: true,
    }));

    const api = new apigwv2.HttpApi(this, "PublicApi", {
      apiName: `${prefix}-public-api`,
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ["authorization", "content-type", "idempotency-key"],
        maxAge: cdk.Duration.hours(1),
      },
      createDefaultStage: true,
    });
    const addRoute = (route: string, method: apigwv2.HttpMethod, target: lambda.IFunction) => api.addRoutes({
      path: route,
      methods: [method],
      integration: new integrations.HttpLambdaIntegration(`${target.node.id}${method}Integration`, target),
    });
    addRoute("/v1/email-verifications", apigwv2.HttpMethod.POST, requestVerification);
    addRoute("/v1/email-verifications/{challengeId}/confirm", apigwv2.HttpMethod.POST, confirmVerification);
    addRoute("/v1/profile-versions", apigwv2.HttpMethod.POST, publishProfile);
    addRoute("/v1/profile-versions/{versionId}", apigwv2.HttpMethod.GET, publishProfile);
    addRoute("/v1/profiles/me", apigwv2.HttpMethod.GET, accessProfile);
    addRoute("/v1/profiles/me", apigwv2.HttpMethod.PATCH, accessProfile);
    addRoute("/v1/profiles/me", apigwv2.HttpMethod.DELETE, accessProfile);
    addRoute("/v1/public-profiles/{slug}", apigwv2.HttpMethod.GET, publicProfile);
    addRoute("/p/{slug}", apigwv2.HttpMethod.GET, publicProfile);
    addRoute("/og/{slug}", apigwv2.HttpMethod.GET, profileOgImage);
    addRoute("/og/profile/{slug}", apigwv2.HttpMethod.GET, profileOgImage);
    addRoute("/profile-images/{slug}/{variant}", apigwv2.HttpMethod.GET, profileImage);
    addRoute("/v1/upload-sessions", apigwv2.HttpMethod.POST, profileDrafts);
    addRoute("/v1/profile-drafts", apigwv2.HttpMethod.POST, profileDrafts);
    addRoute("/v1/profile-drafts", apigwv2.HttpMethod.GET, profileDrafts);
    addRoute("/v1/profile-drafts/{draftId}", apigwv2.HttpMethod.GET, profileDrafts);
    addRoute("/v1/matching-runs", apigwv2.HttpMethod.POST, triggerMatching);
    addRoute("/v1/matches", apigwv2.HttpMethod.GET, pairing);
    addRoute("/v1/matches/refresh", apigwv2.HttpMethod.POST, pairing);
    addRoute("/v1/matches/{matchId}", apigwv2.HttpMethod.GET, pairing);
    addRoute("/v1/matches/{matchId}/invitations", apigwv2.HttpMethod.POST, pairing);
    addRoute("/v1/invitations", apigwv2.HttpMethod.GET, pairing);
    addRoute("/v1/invitation-tokens/preview", apigwv2.HttpMethod.POST, pairing);
    addRoute("/v1/invitation-tokens/respond", apigwv2.HttpMethod.POST, pairing);
    addRoute("/v1/connections/{connectionId}", apigwv2.HttpMethod.GET, pairing);
    addRoute("/v1/support-requests", apigwv2.HttpMethod.POST, supportRequest);

    const apiOrigin = new origins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split("/", api.apiEndpoint)), {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    });
    distribution.addBehavior("/v1/*", apiOrigin, {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });
    distribution.addBehavior("/p/*", apiOrigin, {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });
    distribution.addBehavior("/og/*", apiOrigin, {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      // A private switch must revoke the social image immediately. The image
      // Lambda is already inexpensive and performs a strongly consistent
      // visibility check, so correctness wins over edge caching here.
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });
    distribution.addBehavior("/profile-images/*", apiOrigin, {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    new s3deploy.BucketDeployment(this, "CloudWebsite", {
      sources: [s3deploy.Source.asset(path.join(directory, "..", "static"))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    const schedulerRole = new iam.Role(this, "MatchingSchedulerRole", {
      roleName: `${prefix}-matching-scheduler`,
      assumedBy: new iam.ServicePrincipal("scheduler.amazonaws.com"),
    });
    runMatching.grantInvoke(schedulerRole);
    new scheduler.CfnSchedule(this, "MatchingSchedule", {
      name: `${prefix}-matching`,
      description: "Disabled fallback matching schedule; profile publication uses the immediate trigger",
      scheduleExpression: this.node.tryGetContext("matchingSchedule") ?? "cron(0 1 ? * MON *)",
      scheduleExpressionTimezone: "UTC",
      state: "DISABLED",
      flexibleTimeWindow: { mode: "OFF" },
      target: {
        arn: runMatching.functionArn,
        roleArn: schedulerRole.roleArn,
        retryPolicy: { maximumEventAgeInSeconds: 3_600, maximumRetryAttempts: 2 },
      },
    });

    const operationsAction = new cloudwatchActions.SnsAction(operationsTopic);
    const alarms = [
      new cloudwatch.Alarm(this, "EmailDlqAlarm", {
        alarmName: `${prefix}-email-dlq-visible`,
        metric: outboxDlq.metricApproximateNumberOfMessagesVisible({ period: cdk.Duration.minutes(5) }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
      new cloudwatch.Alarm(this, "PublishFailureAlarm", {
        alarmName: `${prefix}-profile-publish-errors`,
        metric: publishProfile.metricErrors({ period: cdk.Duration.minutes(5) }),
        threshold: 3,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
      new cloudwatch.Alarm(this, "ApiServerErrorAlarm", {
        alarmName: `${prefix}-api-5xx`,
        metric: new cloudwatch.Metric({
          namespace: "AWS/ApiGateway",
          metricName: "5xx",
          dimensionsMap: { ApiId: api.apiId },
          statistic: "Sum",
          period: cdk.Duration.minutes(5),
        }),
        threshold: 3,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }),
    ];
    for (const alarm of alarms) {
      alarm.addAlarmAction(operationsAction);
      alarm.addOkAction(operationsAction);
    }

    new cdk.CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new cdk.CfnOutput(this, "CloudWebsiteUrl", { value: publicSiteOrigin });
    new cdk.CfnOutput(this, "CloudFrontDomainName", { value: distribution.distributionDomainName });
    new cdk.CfnOutput(this, "ProfileTableName", { value: table.tableName });
    new cdk.CfnOutput(this, "VectorIndexName", { value: vectorIndexName });
    new cdk.CfnOutput(this, "MatchingRunFunctionName", { value: runMatching.functionName });
    new cdk.CfnOutput(this, "MatchingScheduleState", { value: "DISABLED" });
    new cdk.CfnOutput(this, "EmailVerificationState", { value: verificationEmailEnabled ? "ENABLED" : "DISABLED" });
    new cdk.CfnOutput(this, "MatchingEmailDeliveryState", { value: matchingEmailDeliveryEnabled ? "ENABLED" : "DISABLED" });
    new cdk.CfnOutput(this, "EmailProvider", { value: emailProvider });
    new cdk.CfnOutput(this, "OperationsTopicArn", { value: operationsTopic.topicArn });
    new cdk.CfnOutput(this, "ProfileImageBucketName", { value: profileImageBucket.bucketName });
    new cdk.CfnOutput(this, "ProfileImageWorkerFunctionName", { value: profileImageWorker.functionName });
    new cdk.CfnOutput(this, "GeminiImageModelId", { value: geminiImageModelId });
    new cdk.CfnOutput(this, "MonthlyBudgetUsd", { value: String(monthlyBudgetUsd) });
  }
}
