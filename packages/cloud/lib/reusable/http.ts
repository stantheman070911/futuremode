import type { APIGatewayProxyResultV2 } from "aws-lambda";

export function jsonResponse(statusCode: number, body: Record<string, unknown>, extraHeaders: Record<string, string> = {}): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

export function htmlResponse(statusCode: number, body: string, extraHeaders: Record<string, string> = {}): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...extraHeaders,
    },
    body,
  };
}

export function parseJsonBody(body: string | undefined): unknown {
  if (!body) throw new Error("request body is required");
  return JSON.parse(body);
}

export function bearerToken(header: string | undefined): string {
  const match = header?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) throw new Error("missing bearer token");
  return match[1];
}
