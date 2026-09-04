import assert from "node:assert/strict";
import test from "node:test";
import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { PitchYourOwnerCloudStack } from "../lib/pitchyourowner-cloud-stack.js";

let synthesized: Template | undefined;

function template() {
  if (synthesized) return synthesized;
  const app = new cdk.App({
    context: {
      emailProvider: "resend",
      verificationEmailEnabled: true,
      matchingEmailDeliveryEnabled: false,
      embeddingModelId: "global.cohere.embed-v4:0",
      embeddingDimensions: 1024,
      matchJudgeModelId: "apac.amazon.nova-pro-v1:0",
      matchJudgeMinMutualScore: 65,
      matchingSchedule: "cron(0 1 ? * MON *)",
      monthlyBudgetUsd: 100,
    },
  });
  synthesized = Template.fromStack(new PitchYourOwnerCloudStack(app, "TestPitchYourOwner", {
    environment: "dev",
    env: { account: "111111111111", region: "ap-southeast-1" },
  }));
  return synthesized;
}

test("keeps the fallback matching schedule disabled", () => {
  template().hasResourceProperties("AWS::Scheduler::Schedule", { State: "DISABLED" });
});

test("protects the profile table and enables recovery", () => {
  template().hasResourceProperties("AWS::DynamoDB::Table", {
    BillingMode: "PAY_PER_REQUEST",
    DeletionProtectionEnabled: true,
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    TimeToLiveSpecification: { AttributeName: "expiresAt", Enabled: true },
  });
});

test("exposes phone paste-back, draft API, pairing, and invitation routes", () => {
  const routes = template().findResources("AWS::ApiGatewayV2::Route");
  const routeKeys = Object.values(routes).map((resource) => resource.Properties.RouteKey).sort();
  assert.deepEqual(routeKeys, [
    "DELETE /v1/profiles/me",
    "GET /v1/invitations",
    "GET /v1/matches",
    "GET /v1/matches/{matchId}",
    "GET /v1/profile-drafts",
    "GET /v1/profile-drafts/{draftId}",
    "GET /v1/profile-versions/{versionId}",
    "GET /v1/profiles/me",
    "PATCH /v1/profiles/me",
    "POST /v1/email-verifications",
    "POST /v1/email-verifications/{challengeId}/confirm",
    "POST /v1/matches/{matchId}/invitations",
    "POST /v1/matching-runs",
    "POST /v1/profile-drafts",
    "POST /v1/profile-versions",
    "POST /v1/support-requests",
    "POST /v1/upload-sessions",
  ]);
});

test("keeps matching email off while verification email remains enabled", () => {
  template().hasOutput("EmailVerificationState", { Value: "ENABLED" });
  template().hasOutput("MatchingEmailDeliveryState", { Value: "DISABLED" });
  template().resourcePropertiesCountIs("AWS::Lambda::EventSourceMapping", { Enabled: false }, 2);
});

test("uses isolated PitchYourOwner resource names and budget", () => {
  template().hasResourceProperties("AWS::Lambda::Function", { FunctionName: "pitchyourowner-dev-profile-publish" });
  template().hasResourceProperties("AWS::SNS::Topic", { TopicName: "pitchyourowner-dev-operations-alerts" });
  template().hasResourceProperties("AWS::Budgets::Budget", {
    Budget: Match.objectLike({ BudgetName: "pitchyourowner-dev-monthly-cost", BudgetLimit: { Amount: 100, Unit: "USD" } }),
  });
});

test("serves app and API through one CloudFront distribution", () => {
  template().hasResourceProperties("AWS::CloudFront::Distribution", {
    DistributionConfig: Match.objectLike({
      CacheBehaviors: Match.arrayWith([Match.objectLike({ PathPattern: "/v1/*", ViewerProtocolPolicy: "redirect-to-https" })]),
      DefaultCacheBehavior: Match.objectLike({ FunctionAssociations: Match.arrayWith([Match.objectLike({ EventType: "viewer-request" })]) }),
    }),
  });
  template().hasResourceProperties("AWS::CloudFront::ResponseHeadersPolicy", {
    ResponseHeadersPolicyConfig: Match.objectLike({ Name: "pitchyourowner-dev-website-security" }),
  });
});

test("grants matching trigger access only to the matching runner", () => {
  template().hasResourceProperties("AWS::Lambda::Function", {
    FunctionName: "pitchyourowner-dev-matching-trigger",
    Environment: { Variables: Match.objectLike({ MATCHING_RUN_FUNCTION_NAME: { Ref: Match.stringLikeRegexp("MatchingRun") } }) },
  });
  const policies = template().findResources("AWS::IAM::Policy");
  assert.ok(Object.values(policies).some((resource) => JSON.stringify(resource).includes("lambda:InvokeFunction")));
});

test("waits for vector provider GetFunction policy before creating the index", () => {
  const customResources = template().findResources("AWS::CloudFormation::CustomResource");
  const vectorIndex = Object.values(customResources).find((resource) => resource.Properties?.IndexName === "profile-matching-v1");
  assert.ok(vectorIndex, "vector index custom resource must exist");
  assert.ok(Array.isArray(vectorIndex.DependsOn), "vector index must have explicit dependencies");
  const policies = template().findResources("AWS::IAM::Policy");
  assert.ok(vectorIndex.DependsOn.some((logicalId: string) => {
    const policy = policies[logicalId];
    return Boolean(policy && JSON.stringify(policy).includes("lambda:GetFunction"));
  }));
});
