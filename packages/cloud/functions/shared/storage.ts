import { createDynamoClients, requiredEnvironment } from "../../lib/reusable/aws-clients.js";

const clients = createDynamoClients();

export const rawDynamo = clients.raw;
export const documentDynamo = clients.document;
export { requiredEnvironment };
