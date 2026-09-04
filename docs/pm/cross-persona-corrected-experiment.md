# PitchYourOwner 跨 persona 抽取策略修正版實驗

## 先看結論

PitchYourOwner 讓使用者請自己的 AI，從實際可存取的對話脈絡起草一份朋友配對 Profile，再由 owner 審核後交給網站。Profile 的七個核心欄位是 `summary`、`interests`、`motivations`、`active_problems`、`recurring_topics`、`friend_intent` 與 `history_scope`；`confidence` 是只供 owner review 的證據強度 metadata。

這份報告不需要先讀其他文件。實驗要回答的是：**同一套 extraction strategy 能否從不同專業的 AI 對話中，找出適合朋友配對的具體興趣、動機、當前問題與反覆主題，同時排除不相關或已過時的內容？**

我們建立 6 個 synthetic personas，每人 8 段對話，共 48 段。每個 Persona 事先定義 5 個應被辨識的主訊號，但這些期待答案在模型完成輸出前保持隱藏。

直接結果：

- **30/30**：6 人 × 每人 5 個預期主訊號，全數在輸出中出現。這只衡量本組 synthetic corpus 的 signal recall，不是 Profile 準確率。
- **3/6**：只有三份 Profile 完全沒有一次性雜訊。
- **6/6**：明確已解決的問題都沒有被錯列為 `active_problems`，但其中一例仍被寫進 summary。
- **2/6**：只有兩份輸出在本輪人工檢查中沒有 notable error。

因此可以判斷：同一策略跨領域找主題有初步可行性，但現有輸出還不能直接當作乾淨、準確、可發布的 Profile。

一個具體例子：舞者案例的五個主訊號全部被找到，所以 recall 是 5/5；但 summary 同時提到一次性的素食晚餐問題，並加入來源沒有的情緒「不甘」。這說明 5/5 仍可能是一份不合格的 Profile。

## 這次到底測什麼

測試同一套 extraction strategy 與同一份 schema，放到不同領域的對話紀錄時，能否辨識對朋友配對有用的 interest、motivation、active problem 與 recurring topic。

這次**不測** ChatGPT／Claude／Codex 是否能讀完整帳戶、能否呼叫 API 或能否自動上傳。Provider 不是比較軸。

## 舊的 22/22 是什麼，為什麼無效

在這個六人實驗之前，團隊做過另一個四 Persona 實驗。攝影師有 6 個預期訊號、舞者 5 個、海洋生物學家 6 個、前端工程師 5 個，合計 22 個；模型輸出重新提到全部 22 個，因此當時寫成 `22/22`。

但第一版把每個 Persona 的 `Expected strong signals` 跟 conversation history 一起餵給 extractor。模型直接看到了標準答案，因此 `22/22` 不能當作抽取能力的證據。它不是 22 位使用者、不是 22 次測試，也不是 100% 準確率。

第一版也把 simulated ChatGPT 與 simulated Codex 寫成主要差異，但真正要改變的是 persona／domain，而不是執行工具。

## 修正方法

- 六個跨領域 persona：人像攝影、當代舞蹈、海洋生物、前端工程、行銷策略、體驗設計。
- 每人八段 synthetic conversation excerpts。
- 每份 history 同時含 repeated signal、still-active problem、resolved issue、one-off noise 與未明說的 friend intent。
- 所有人使用完全相同的 `strategy.md` 與 `output-schema.json`。
- Gold labels 只存在 `gold/gold-labels.json`；extractor 完成輸出前看不到它。
- 以 hidden gold labels 做人工 semantic checklist；這不是獨立人類評審。

## 結果

狀態註記（2026-09-04）：`strategy.md` 已在本輪輸出完成後更新。以下結果保留為歷史結果；在使用相同 corpus 重跑前，不應宣稱它們是目前 prompt 的測試結果。

| Persona | 主要訊號 | One-off 完全未出現 | Resolved 未誤列 active | Friend intent 校準 | Scope 誠實 | Schema |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 人像攝影師 | 5/5 | 是 | 是 | 是 | 是 | 是 |
| 當代舞者 | 5/5 | 否 | 是 | 是 | 是 | 是 |
| 海洋生物學家 | 5/5 | 否 | 是 | 是 | 是 | 是 |
| 前端工程師 | 5/5 | 是 | 是 | 是 | 是 | 是 |
| 行銷策略師 | 5/5 | 否 | 是 | 是 | 是 | 是 |
| 體驗設計師 | 5/5 | 是 | 是 | 是 | 是 | 是 |

整體：30/30 個預設主要訊號被辨識；6/6 未把已解決問題誤列為 active；6/6 將未明說的 friend intent 標為 low；6/6 誠實描述 history scope；6/6 schema-valid。

但策略尚未達標：只有 3/6 完全不提 one-off noise。舞者、海洋生物學家、行銷策略師的 summary 反而說明「某個一次性問題被排除」，把本來應該消失的雜訊帶進 profile。舞者結果另出現來源沒有的情緒詞；行銷策略師在 active problem 與 recurring topic 的邊界也不夠穩定。

## 策略需要怎麼改

1. 把「不要 elevate one-off」改成「one-off 與 resolved issue 必須從所有公開 profile 欄位完全消失；不要在 summary 解釋你排除了什麼」。
2. `active_problems` 必須有明確的 unresolved／still testing 證據；單純反覆詢問仍留在 `recurring_topics`。
3. 禁止補寫來源沒有的情緒、身份與專業程度。
4. Summary 只保留 2–3 個最能驅動配對的訊號，避免把 extraction rationale 寫進使用者 profile。
5. 在 evaluation-only 模式保留 private evidence mapping，讓研究者能核對每個欄位來自哪些 excerpts，並與 production payload 分開。

## 可以下的結論與不能下的結論

可以說：目前同一策略能在六種領域辨識主要主題、active/resolved 狀態、friend-intent 不確定性與 scope 邊界；它有跨 persona 的初步可行性。

不能說：準確率已達 100%、適用所有專業、真人會認為 profile 準確、ChatGPT 能讀完整歷史，或手機自動上傳一定能成功。

下一步應以 10–30 位真實但授權的跨領域使用者做 owner-blinded review，量測欄位準確度、必須修改的比例、遺漏訊號與配對偏好。
