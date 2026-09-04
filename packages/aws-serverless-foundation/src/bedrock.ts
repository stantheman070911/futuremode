import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

export type EmbeddingInputType = "search_document" | "search_query" | "classification" | "clustering";

export function decodeFloatEmbedding(body: Uint8Array, expectedDimensions: number): number[] {
  const decoded = JSON.parse(new TextDecoder().decode(body)) as {
    embeddings?: number[][] | { float?: number[][] };
    embeddings_by_type?: { float?: number[][] };
  };
  const vector = Array.isArray(decoded.embeddings)
    ? decoded.embeddings[0]
    : decoded.embeddings?.float?.[0] ?? decoded.embeddings_by_type?.float?.[0];
  if (!Array.isArray(vector) || vector.length !== expectedDimensions || vector.some((value) => !Number.isFinite(value))) {
    throw new Error(`embedding response must contain ${expectedDimensions} finite numbers`);
  }
  return vector;
}

export async function embedText(options: {
  text: string;
  modelId: string;
  dimensions: number;
  inputType?: EmbeddingInputType;
  maxTokens?: number;
  truncate?: "LEFT" | "RIGHT" | "NONE";
  client?: BedrockRuntimeClient;
}): Promise<number[]> {
  const client = options.client ?? new BedrockRuntimeClient({});
  const response = await client.send(new InvokeModelCommand({
    modelId: options.modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      input_type: options.inputType ?? "search_document",
      texts: [options.text],
      embedding_types: ["float"],
      output_dimension: options.dimensions,
      max_tokens: options.maxTokens ?? 128_000,
      truncate: options.truncate ?? "RIGHT",
    }),
  }));
  return decodeFloatEmbedding(response.body, options.dimensions);
}

export function parseJsonObject(text: string): Record<string, unknown> {
  const raw = text.trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payloadText = fenced ? fenced[1].trim() : raw;
  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadText);
  } catch {
    const start = payloadText.indexOf("{");
    const end = payloadText.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("model response did not contain a valid JSON object");
    parsed = JSON.parse(payloadText.slice(start, end + 1));
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("model response must contain a JSON object");
  }
  return parsed as Record<string, unknown>;
}

export function textFromConverseResponse(response: ConverseCommandOutput): string {
  return response.output?.message?.content?.map((entry) => entry.text ?? "").join("\n") ?? "";
}

export async function requestJson(options: {
  prompt: string;
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  client?: BedrockRuntimeClient;
}): Promise<Record<string, unknown>> {
  const client = options.client ?? new BedrockRuntimeClient({});
  const response = await client.send(new ConverseCommand({
    modelId: options.modelId,
    messages: [{ role: "user", content: [{ text: options.prompt }] }],
    inferenceConfig: {
      maxTokens: options.maxTokens ?? 4_096,
      temperature: options.temperature ?? 0.1,
    },
  }));
  return parseJsonObject(textFromConverseResponse(response));
}
