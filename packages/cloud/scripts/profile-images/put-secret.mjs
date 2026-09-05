import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CreateSecretCommand, DescribeSecretCommand, PutSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const environment = process.env.PYO_STACK_ENVIRONMENT || "hackathon";
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-southeast-1";
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const sourcePath = path.resolve(process.env.GEMINI_SOURCE_CONFIG || path.join(repositoryRoot, ".secrets/gemini-config.json"));
const secretName = `pitchyourowner/${environment}/gemini-image-api-key`;

if (!apply) {
  console.log(JSON.stringify({ mode: "dry-run", region, environment, secretName, sourcePath, next: "Re-run with --apply to create or update the secret." }, null, 2));
  process.exit(0);
}

const config = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const apiKey = config?.GEMINI_CONFIG?.API_KEY;
if (typeof apiKey !== "string" || !apiKey.trim()) throw new Error("GEMINI_CONFIG.API_KEY is missing");

const client = new SecretsManagerClient({ region });
let exists = true;
try {
  await client.send(new DescribeSecretCommand({ SecretId: secretName }));
} catch (error) {
  if (error?.name === "ResourceNotFoundException") exists = false;
  else throw error;
}

if (exists) await client.send(new PutSecretValueCommand({ SecretId: secretName, SecretString: apiKey.trim() }));
else await client.send(new CreateSecretCommand({ Name: secretName, SecretString: apiKey.trim(), Description: "Gemini API key for PitchYourOwner profile mascot generation" }));
console.log(JSON.stringify({ mode: "applied", region, environment, secretName, operation: exists ? "updated" : "created" }));
