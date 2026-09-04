import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-southeast-1";
export const TEST_RUN_ID = "pitchyourowner-cross-profession-demo-v1";
export const STACK_KEY = process.env.PYO_STACK_KEY;
export const STACK_ENVIRONMENT = process.env.PYO_STACK_ENVIRONMENT;
export const EMBEDDING_MODEL_ID = "global.cohere.embed-v4:0";
export const EMBEDDING_DIMENSIONS = 1024;

export function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function demoProfileId(email) {
  return sha256(`pitchyourowner-profile:${sha256(String(email).trim().toLowerCase())}`).slice(0, 32);
}

export async function outputs() {
  if (!STACK_KEY || !STACK_ENVIRONMENT || !process.env.PYO_OUTPUTS_FILE) {
    throw new Error("PYO_STACK_KEY, PYO_STACK_ENVIRONMENT, and PYO_OUTPUTS_FILE are required; demo scripts never default to a deployed environment");
  }
  if (STACK_ENVIRONMENT !== "e2e" || !/^PitchYourOwner-e2e(?:-|$)/.test(STACK_KEY)) {
    throw new Error(`refusing demo fixture access outside an isolated e2e stack: ${STACK_KEY}/${STACK_ENVIRONMENT}`);
  }
  const path = resolve(process.cwd(), process.env.PYO_OUTPUTS_FILE || "cdk-outputs-hackathon.json");
  const parsed = JSON.parse(await readFile(path, "utf8"));
  if (!parsed[STACK_KEY]) throw new Error(`${STACK_KEY} outputs not found in ${path}`);
  return parsed[STACK_KEY];
}

export function matchingDocument(profile) {
  return [
    `Summary: ${profile.summary}`,
    `Specific interests:\n${profile.interests.map((item) => `- ${item}`).join("\n")}`,
    `Motivations:\n${profile.motivations.map((item) => `- ${item}`).join("\n")}`,
    `Active problems:\n${profile.active_problems.map((item) => `- ${item}`).join("\n")}`,
    `Recurring topics:\n${profile.recurring_topics.map((item) => `- ${item}`).join("\n")}`,
    `Friend intent: ${profile.friend_intent}`,
  ].join("\n\n");
}

export async function embed(profile) {
  const client = new BedrockRuntimeClient({ region: REGION });
  const response = await client.send(new InvokeModelCommand({
    modelId: EMBEDDING_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      input_type: "search_document",
      texts: [matchingDocument(profile)],
      embedding_types: ["float"],
      output_dimension: EMBEDDING_DIMENSIONS,
      max_tokens: 128_000,
      truncate: "RIGHT",
    }),
  }));
  const parsed = JSON.parse(new TextDecoder().decode(response.body));
  const vector = Array.isArray(parsed.embeddings)
    ? parsed.embeddings[0]
    : parsed.embeddings?.float?.[0] ?? parsed.embeddings_by_type?.float?.[0];
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`embedding must contain ${EMBEDDING_DIMENSIONS} floats`);
  }
  return vector;
}

export const DEMO_PROFILES = [
  {
    id: "photographer",
    displayName: "Ari C.",
    email: "ari.photographer@demo.pitchyourowner.invalid",
    profile: {
      summary: "Portrait photographer studying how tiny shifts in posture and tension change the emotional reading of an image.",
      interests: ["subject direction", "body language", "low-light portraiture", "visual storytelling"],
      motivations: ["help people look natural without losing intention", "make direction repeatable under time pressure"],
      active_problems: ["giving precise physical direction without making a subject self-conscious", "preserving gesture in a still frame"],
      recurring_topics: ["posture and tension", "micro-expression", "negative space", "trust between subject and photographer"],
      friend_intent: "Meet dancers, directors, coaches, or photographers who experiment with embodied expression and can compare methods.",
      history_scope: "Synthetic hackathon test profile; no personal chat history was used.",
      confidence: { summary: "high", interests: "high", motivations: "high", active_problems: "high", recurring_topics: "high", friend_intent: "high" },
    },
  },
  {
    id: "dancer",
    displayName: "Ren H.",
    email: "ren.dancer@demo.pitchyourowner.invalid",
    profile: {
      summary: "Contemporary dancer exploring how posture, timing, and controlled tension make intention legible before a movement finishes.",
      interests: ["body language", "movement quality", "improvisation", "stage presence"],
      motivations: ["make subtle movement readable", "exchange practical feedback across creative disciplines"],
      active_problems: ["calibrating how much tension communicates intention without looking forced", "translating movement direction into repeatable cues"],
      recurring_topics: ["posture and tension", "micro-expression", "rhythm", "audience perception"],
      friend_intent: "Meet photographers, performers, or directors who are testing how small physical choices change what an audience perceives.",
      history_scope: "Synthetic hackathon test profile; no personal chat history was used.",
      confidence: { summary: "high", interests: "high", motivations: "high", active_problems: "high", recurring_topics: "high", friend_intent: "high" },
    },
  },
  {
    id: "sound_designer",
    displayName: "Kai L.",
    email: "kai.sound@demo.pitchyourowner.invalid",
    profile: {
      summary: "Sound designer interested in how silence, timing, and expectation shape the emotional rhythm of a scene.",
      interests: ["silence as structure", "scene rhythm", "audience attention", "collaborative critique"],
      motivations: ["make emotional transitions more precise", "learn how other disciplines shape attention"],
      active_problems: ["deciding where silence strengthens rather than stalls a scene", "communicating timing choices to visual collaborators"],
      recurring_topics: ["rhythm", "negative space", "audience perception", "timing and tension"],
      friend_intent: "Meet performers, photographers, editors, or directors who use timing and negative space to guide attention.",
      history_scope: "Synthetic hackathon test profile; no personal chat history was used.",
      confidence: { summary: "high", interests: "high", motivations: "high", active_problems: "high", recurring_topics: "high", friend_intent: "high" },
    },
  },
];
