# AWS serverless foundation

Product-neutral building blocks for small AWS serverless applications.

Included:

- deterministic serialization, content fingerprints, opaque tokens, and email normalization;
- strict validation primitives;
- HTTP response, JSON body, and bearer-token helpers;
- configurable DynamoDB clients and expiring session loading;
- configurable Bedrock text embeddings and JSON-returning model calls;
- an SES email transport;
- protected DynamoDB tables, static SPA hosting, vector-index provisioning, Lambda defaults, queues, alarms, and tagged budgets.

Excluded by design:

- route names and endpoint contracts;
- domain, entity, ranking, and decision schemas;
- prompts, scoring policy, and model identifiers;
- source connectors and collection rules;
- user-facing copy, visual design, and workflow state.

Callers supply all names, routes, schema, authorization rules, models, and domain behavior. The test suite also scans the reusable boundary for fixed routes and external URLs.

## Verify

```sh
npm ci
npm test
npm run build
```
