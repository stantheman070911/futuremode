import { DescribeTableCommand, DynamoDBClient, UpdateTableCommand } from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient({});

type ScalarAttributeType = "S" | "N" | "B";
type SearchSchemaElementType = "HASH" | "INLINE_FILTER";

interface VectorIndexProperty {
  AttributeName: string;
  AttributeType: ScalarAttributeType;
  SearchSchemaElementType: SearchSchemaElementType;
}

interface ProviderEvent {
  RequestType: "Create" | "Update" | "Delete";
  PhysicalResourceId?: string;
  ResourceProperties: {
    TableName: string;
    IndexName: string;
    Dimensions: string | number;
    VectorAttributeName: string;
    SearchSchema: VectorIndexProperty[];
    ProjectionAttributes?: string[];
  };
}

function physicalId(event: ProviderEvent): string {
  return `dynamodb-vector-index:${event.ResourceProperties.TableName}:${event.ResourceProperties.IndexName}`;
}

export async function onEvent(event: ProviderEvent) {
  if (event.RequestType === "Delete") return { PhysicalResourceId: event.PhysicalResourceId ?? physicalId(event) };
  const properties = event.ResourceProperties;
  const table = (await dynamo.send(new DescribeTableCommand({ TableName: properties.TableName }))).Table;
  const existing = table?.VectorIndexes?.find((entry) => entry.IndexName === properties.IndexName);
  if (!existing) {
    await dynamo.send(new UpdateTableCommand({
      TableName: properties.TableName,
      AttributeDefinitions: properties.SearchSchema.map((entry) => ({
        AttributeName: entry.AttributeName,
        AttributeType: entry.AttributeType,
      })),
      VectorIndexUpdates: [{
        Create: {
          IndexName: properties.IndexName,
          VectorAttribute: { AttributeName: properties.VectorAttributeName },
          Dimensions: Number(properties.Dimensions),
          DistanceFunction: "COSINE",
          SearchSchema: properties.SearchSchema.map((entry) => ({
            AttributeName: entry.AttributeName,
            SearchSchemaElementType: entry.SearchSchemaElementType,
          })),
          Projection: properties.ProjectionAttributes?.length
            ? { ProjectionType: "INCLUDE", NonKeyAttributes: properties.ProjectionAttributes }
            : { ProjectionType: "KEYS_ONLY" },
        },
      }],
    }));
  } else if (
    existing.Dimensions !== Number(properties.Dimensions)
    || existing.DistanceFunction !== "COSINE"
    || existing.VectorAttribute?.AttributeName !== properties.VectorAttributeName
  ) {
    throw new Error("existing vector index does not match the requested immutable configuration");
  }
  return { PhysicalResourceId: physicalId(event) };
}

export async function isComplete(event: ProviderEvent) {
  if (event.RequestType === "Delete") return { IsComplete: true };
  const table = (await dynamo.send(new DescribeTableCommand({ TableName: event.ResourceProperties.TableName }))).Table;
  const index = table?.VectorIndexes?.find((entry) => entry.IndexName === event.ResourceProperties.IndexName);
  if (index?.IndexStatus === "DELETING") throw new Error("vector index entered DELETING state");
  return { IsComplete: index?.IndexStatus === "ACTIVE" && index.Backfilling !== true };
}
