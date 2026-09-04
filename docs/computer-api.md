# Computer agent draft-upload API

The computer path is intentionally API-only. WebMCP is not part of the hackathon scope.

The API creates a draft; it cannot publish a profile. Final publication always happens after the owner signs in, reviews the rendered profile on the site, and selects **Confirm & publish**.

## 1. Create an upload capability

From **Settings → Computer API**, the signed-in owner selects **Generate 24-hour upload token**. The authenticated request is:

```http
POST /v1/upload-sessions
Authorization: Bearer <owner-session-token>
```

The response contains:

```json
{
  "submit_url": "https://<site>/v1/profile-drafts",
  "upload_token": "<secret>",
  "expires_at": "<ISO timestamp>",
  "expires_in_seconds": 86400,
  "capability": "single-use write-only draft creation"
}
```

The capability expires after 24 hours, succeeds only once, and cannot read, edit, or publish profile data.

## 2. Agent creates the draft

```http
POST <submit_url>
Authorization: Bearer <upload_token>
Content-Type: application/json
```

```json
{
  "locale": "zh-Hant",
  "profile": {
    "summary": "…",
    "interests": ["…"],
    "motivations": ["…"],
    "active_problems": ["…"],
    "recurring_topics": ["…"],
    "friend_intent": "…",
    "history_scope": "…",
    "confidence": {
      "summary": "high",
      "interests": "medium",
      "motivations": "medium",
      "active_problems": "high",
      "recurring_topics": "high",
      "friend_intent": "medium"
    }
  }
}
```

A successful response is HTTP `201` with `status: "draft"`. Any other response is a failure; the agent must not claim success.

## 3. Owner reviews and publishes

The owner returns to the site, opens the new draft, reviews the rendered fields, makes any needed edits, and proceeds to the separate read-only publication review. Publication uses the owner session—not the upload capability.

`confidence` is owner-review metadata only and never influences matching or appears to another user. The matching document uses `summary`, `interests`, `motivations`, `active_problems`, `recurring_topics`, and `friend_intent`; it excludes `history_scope`.
