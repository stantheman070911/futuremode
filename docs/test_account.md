# PitchYourOwner test-account policy

This document defines the approved test identities used by the deployed
PitchYourOwner application. It separates non-login fixtures, synthetic pairing
accounts, and real-email journey-test accounts so that one email address cannot
silently represent two different owners.

本文件定義 PitchYourOwner 部署環境核准使用的測試身分類型。Fixture、合成配對帳號與真實
Email 流程測試帳號必須分開管理，避免同一個 Email 同時代表兩個不同的 owner。

## 1. Fixture profiles

- 系統保留三個 fixture profiles：舞者、紀錄片工作者與公共財政分析師。
- Fixture 是由受控腳本建立的候選 profile，**不是可登入的帳號**。
- Fixture 只會出現在指定測試 audience 或明確核准的測試 cohort；不得出現在一般真實
  使用者的配對結果中。
- 三個 fixture 中只有一個設定了可收信 Email；另外兩個 fixture 使用不可投遞地址，且
  不可寄送邀請。
- 唯一保留的可收信 fixture 是紀錄片工作者／赤狐。實際 Email 只由部署環境變數提供，
  不寫入 repository。
- 沒有可收信 Email 的 fixture 必須使用不可投遞地址，並設定
  `fixtureInvitationEnabled=false`。
- Fixture 必須保留 `isFixtureProfile=true`、`cleanupSafe=true`、固定
  `fixtureSetId` 與 audience scope，才能被更新或刪除。

## 2. `test10xx@futuremode.test` synthetic accounts

- 系統保留 `test1000@futuremode.test` 至 `test1009@futuremode.test` 共十個合成帳號。
- 這十個帳號只用於受控的 pairing、分頁、分數、邀請、接受／拒絕與 connection 測試。
- 它們不是一般使用者，也不負責驗證真實 Email 註冊或外部 AI 建檔流程。
- 它們使用固定測試驗證碼和預先準備的 schema-valid persona，使 pairing 測試可重複。
- 它們只能看見相同 test cohort 與明確標記為安全的 fixture，不得看見或邀請一般真實
  使用者。
- 一般真實使用者也不得看見這十個帳號。
- 測試 Email 不會對外寄信；邀請與 connection Email 必須留在 captured test delivery。
- 所有資料必須帶有 `isTestProfile=true`、`isManualTestProfile=true`、
  `cleanupSafe=true` 及正確的 `testRunId`／`testCohortId`。

## 3. Real-email journey-test accounts

- 真實 Email 測試帳號用於驗證一般使用者實際經歷的完整流程。
- 帳號使用真正寄到該 Email 的 OTP 註冊，不使用 `futuremode.test` 的固定驗證碼。
- 註冊後不注入或顯示預填 profile。測試者必須依正式流程選擇 AI，完成 ChatGPT／Claude
  回合、主題排除、JSON 貼回、視覺化編輯與確認上傳。
- Profile 只能在測試者按下「確認並上傳」後建立；測試情境名稱或預期 animal persona
  不得冒充已發布 profile。
- 真實 Email 測試帳號與一般真實使用者隔離：它不進入一般使用者的候選池，也不得出現
  在一般使用者的配對頁。
- 它只能與同一個 journey-test cohort 及明確核准的 fixture 互動。若測試需要真實邀請
  Email，只能寄給 allowlist 中的受控地址。
- 真實 Email allowlist 與測試情境設定儲存在 Secrets Manager，不寫入 repository。
- 同一個 Email 不得同時是 fixture 的收信地址與 real-email journey-test account。

目前核准的 Host-controlled Gmail 用途是 real-email journey test；測試情境 key 為
`deployment-boundary-otter`（「拆解部署邊界的工程水獺」）。這個名稱是測試目標，不是
預填輸出。Animal persona 仍由外部 AI 根據授權內容產生，並由 owner 在視覺化編輯頁確認
或修改。實際 Email 只存在 Secrets Manager，不寫入 repository。

## 4. Visibility and interaction matrix

| Viewer / candidate | Fixture | `futuremode.test` | Real-email journey test | Regular real user |
| --- | --- | --- | --- | --- |
| Regular real user | Hidden | Hidden | Hidden | Visible when public |
| `futuremode.test` | Approved safe fixtures only | Same cohort only | Hidden | Hidden |
| Real-email journey test | Approved fixtures only | Hidden by default | Same cohort only | Hidden |

「Hidden」至少表示不建立 matching edge、不進入 retrieval result、不出現在配對列表，也不能
透過 invitation API 越權邀請。直接測試連結若因驗證 social card 而啟用，必須是明確、
受控的測試情境，不能讓 profile 進入一般使用者 discovery。

## 5. Lifecycle operations

真實 Email 測試帳號必須提供以下受控操作：

- `status`：只顯示帳號類型、profile／session／圖片／配對紀錄數量與狀態，不輸出 OTP、
  token 或完整 profile。
- `add`：把一個精確 Email 加入 Secrets Manager allowlist，指定 scenario 與 cohort；不建立
  或發布 profile。
- `reset`：保留 allowlist，但移除該 owner 的 profile versions、public slug、embeddings、
  result sets、雙向 pairing edges、invitations、tokens、connections、interest intents、
  outbox、圖片、social-card 衍生物、sessions、OTP challenges、rate-limit 與 idempotency
  records，使它回到首次註冊狀態。
- `remove`：先執行完整 reset，再從 allowlist 移除；不得留下使用該 Email 的 fixture 或
  invitation recipient。

所有寫入操作預設只能 dry-run，並要求包含完整目標 Email 與操作名稱的 confirmation
phrase。Cleanup 只能處理精確解析出的 owner、cohort 或 fixture set，不能使用寬鬆掃描結果
直接刪除資料。

維運指令從 `packages/cloud/` 執行：

```bash
# Read-only status
AWS_PROFILE=<profile> npm run journey-test:account -- status --email <real-email>

# Dry-run add
AWS_PROFILE=<profile> npm run journey-test:account -- add \
  --email <real-email> --scenario <scenario-key>

# Apply add; reset/remove follow the same confirmation shape
PYO_JOURNEY_TEST_CONFIRM='add:<real-email>' AWS_PROFILE=<profile> \
  npm run journey-test:account -- add --email <real-email> \
  --scenario <scenario-key> --apply
```

若既有 fixture 正在使用該收信地址，必須先用 `fixtures:detach-email` dry-run，確認唯一 fixture、
pair 數與待刪除紀錄數，再用精確 `PYO_FIXTURE_DETACH_CONFIRM=detach:<real-email>` 執行。

## 6. Verified production state

2026-09-07（Asia/Taipei）完成 production 遷移與部署後，已驗證：

1. 三個 private fixture 都存在；一個可寄送邀請，兩個使用不可投遞地址且邀請關閉。
2. 公共財政分析師／老鷹 fixture 已脫離 Host-controlled Gmail；與舊 fixture 收件地址相關的
   invitation、connection 與 outbox 紀錄已清除。
3. 十個 `futuremode.test` 帳號仍存在，且只使用固定碼、預填 draft 與 synthetic cohort。
4. 一個 Host-controlled real-email journey account 已加入 Secrets Manager allowlist，scenario
   是 `deployment-boundary-otter`；它使用正常 Email OTP，且不觸發 prefilled bootstrap。
5. 該 journey account 已 reset 為首次註冊狀態：沒有 profile、相關 DynamoDB 紀錄、pair、
   result set、圖片或 fixture Email 衝突。
6. Profile publish、matching 與 image worker 已部署相同的
   `hackathon-journey-20260907` cohort 設定；journey profile 發布後只能看見同 cohort profile
   與核准 fixture，一般真實使用者看不到它。
7. `status`、`add`、`reset`、`remove` 與 fixture Email detach 都是 dry-run-first，寫入時需要
   精確 confirmation phrase；測試帳號可重複回到首次註冊狀態。

驗證採用 CloudFormation stack `PitchYourOwner-hackathon`、DynamoDB table
`pitchyourowner-hackathon-profile-store` 與 production test-account secret 的結構化查詢；不把
OTP、verification code、session token 或完整 profile 寫入報告。
