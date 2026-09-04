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

## Resume the draft on the phone｜在手機接續草稿

After the computer receives HTTP `201`, the owner returns to PitchYourOwner on the phone, opens **Bring your pitch back**, and selects **Resume computer draft**. The site fetches the newest draft owned by the signed-in account, renders the seven editable fields and owner-only confidence, then continues to the same read-only final review. The owner supplies a display name and explicitly selects **Confirm & upload**; the computer token can never publish by itself.

電腦取得 HTTP `201` 後，owner 回到手機上的 PitchYourOwner，在 **Bring your pitch back** 選擇 **Resume computer draft**。網站會取得該登入帳號最新的草稿，渲染七個可編輯欄位與僅供 owner 審核的 confidence，再進入相同的唯讀 final review。Owner 需補上 display name 並明確選擇 **Confirm & upload**；電腦端 token 永遠不能自行發布。

## 3. Owner reviews and publishes

The owner returns to the site, opens the new draft, reviews the rendered fields, makes any needed edits, and proceeds to the separate read-only publication review. Publication uses the owner session—not the upload capability.

`confidence` is owner-review metadata only and never influences matching or appears to another user. The matching document uses `summary`, `interests`, `motivations`, `active_problems`, `recurring_topics`, and `friend_intent`; it excludes `history_scope`.
