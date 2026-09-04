import { DescribeTableCommand, DynamoDBClient, UpdateTableCommand } from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient({});

interface ProviderEvent {
  RequestType: "Create" | "Update" | "Delete";
  PhysicalResourceId?: string;
  ResourceProperties: {
    TableName: string;
    IndexName: string;
    Dimensions: string | number;
  };
}

export async function onEvent(event: ProviderEvent) {
  const { TableName, IndexName } = event.ResourceProperties;
  const physicalResourceId = `dynamodb-vector-index:${TableName}:${IndexName}`;
  if (event.RequestType === "Delete") return { PhysicalResourceId: event.PhysicalResourceId ?? physicalResourceId };
  const table = (await dynamo.send(new DescribeTableCommand({ TableName }))).Table;
  const existing = table?.VectorIndexes?.find((index) => index.IndexName === IndexName);
  if (!existing) {
    await dynamo.send(new UpdateTableCommand({
      TableName,
      // DynamoDB requires every vector search-schema attribute to have a
      // scalar definition, just like the key attributes of a GSI. Keep the
      // matchability flag numeric so it can be used both as an inline filter
      // and by the DocumentClient without ambiguous boolean key typing.
      AttributeDefinitions: [
        { AttributeName: "profile_scope", AttributeType: "S" },
        { AttributeName: "is_matchable", AttributeType: "N" },
      ],
      VectorIndexUpdates: [{
        Create: {
          IndexName,
          VectorAttribute: { AttributeName: "embedding" },
          Dimensions: Number(event.ResourceProperties.Dimensions),
          DistanceFunction: "COSINE",
          SearchSchema: [
            { AttributeName: "profile_scope", SearchSchemaElementType: "HASH" },
            { AttributeName: "is_matchable", SearchSchemaElementType: "INLINE_FILTER" },
          ],
          Projection: {
            ProjectionType: "INCLUDE",
            NonKeyAttributes: ["profileId", "versionId", "emailHash", "locale"],
          },
        },
      }],
    }));
  } else if (
    existing.Dimensions !== Number(event.ResourceProperties.Dimensions)
    || existing.DistanceFunction !== "COSINE"
    || existing.VectorAttribute?.AttributeName !== "embedding"
  ) {
    throw new Error("existing DynamoDB vector index does not match the immutable PitchYourOwner V1 contract");
  }
  return { PhysicalResourceId: physicalResourceId };
}

export async function isComplete(event: ProviderEvent) {
  if (event.RequestType === "Delete") return { IsComplete: true };
  const table = (await dynamo.send(new DescribeTableCommand({ TableName: event.ResourceProperties.TableName }))).Table;
  const index = table?.VectorIndexes?.find((candidate) => candidate.IndexName === event.ResourceProperties.IndexName);
  if (index?.IndexStatus === "DELETING") throw new Error("DynamoDB vector index entered DELETING state");
  return { IsComplete: index?.IndexStatus === "ACTIVE" && index.Backfilling !== true };
}
