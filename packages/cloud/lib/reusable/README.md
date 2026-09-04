# Reusable serverless foundation

This directory contains product-neutral building blocks for small AWS serverless applications.

Included:

- deterministic serialization, content fingerprints, opaque tokens, and email normalization;
- strict validation primitives;
- API Gateway response and bearer-token helpers;
- configurable DynamoDB clients and expiring session loading;
- configurable Bedrock text embeddings and JSON-returning judge calls;
- protected DynamoDB tables, static SPA hosting, vector-index provisioning, Lambda defaults, and tagged budgets.

Excluded by design:

- route names and endpoint contracts;
- product, user-profile, role, ranking, or decision schemas;
- model prompts and scoring policy;
- source connectors and collection rules;
- user-facing copy, visual design, and workflow state.

Callers must supply names, schema, routes, evidence policy, authorization rules, model identifiers, and source-specific behavior. This boundary keeps infrastructure and AI transport reusable without treating one product's decisions as platform defaults.
