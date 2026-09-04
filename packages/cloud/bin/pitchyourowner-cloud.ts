#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { PitchYourOwnerCloudStack } from "../lib/pitchyourowner-cloud-stack.js";

const app = new cdk.App();
const environment = app.node.tryGetContext("environment") ?? "dev";
const region = app.node.tryGetContext("region") ?? "ap-southeast-1";

// This stack is intentionally isolated from VibeMate-dev.
new PitchYourOwnerCloudStack(app, `PitchYourOwner-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region,
  },
  environment,
  description: "PitchYourOwner phone-first owner pitch, pairing, and invitation stack",
});
