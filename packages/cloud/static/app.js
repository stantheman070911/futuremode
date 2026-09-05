const STORAGE_KEY = "pitchyourowner.session.v1";
const DRAFT_KEY = "pitchyourowner.draft.v1";
const DRAFT_MODE_KEY = "pitchyourowner.draft-mode.v1";
const IMPORT_MODE_KEY = "pitchyourowner.import-mode.v1";
const HANDOFF_KEY = "pitchyourowner.handoff.v1";
const PUBLISH_ATTEMPT_KEY = "pitchyourowner.publish-attempt.v1";
const AUTH_FLOW_KEY = "pitchyourowner.auth-flow.v1";
const LOCALE_KEY = "pitchyourowner.locale.v1";
const DEMO_KEY = "pitchyourowner.demo.v1";
const DEMO_DRAFT_KEY = "pitchyourowner.demo-draft.v1";
const DEMO_MATCH_KEY = "pitchyourowner.demo-match.v1";
const DEMO_PROFILE_KEY = "pitchyourowner.demo-profile.v1";
const LAST_PUBLISH_KEY = "pitchyourowner.last-publish.v1";
const MATCH_SEARCH_WINDOW_MS = 3 * 60 * 1000;
const MATCH_POLL_INTERVAL_MS = 6 * 1000;
let CONFIDENCE_FIELDS = ["summary", "interests", "motivations", "active_problems", "recurring_topics", "friend_intent"];
let CONFIDENCE_LEVELS = ["high", "medium", "low"];
let ARRAY_FIELDS = ["interests", "motivations", "active_problems", "recurring_topics"];
let PROFILE_SCHEMA_CONFIG = null;
const COPY = {
  en: {
    "skip": "Skip to main content", "nav.label": "Main navigation", "nav.matches": "Matches", "nav.invites": "Invites", "nav.pitch": "My Pitch", "nav.settings": "Settings",
    "language.switch": "繁中", "language.current": "English", "account": "Account", "common.loading": "Working…", "common.try": "Try again", "common.cancel": "Cancel",
    "start.title": "Your agent<br>knows you.<span>Let it pitch you.</span>", "start.promise": "Meet someone who cares about the same thing, for the same reason, right now.", "start.checkpoints": "Two owner approval gates", "start.check1": "Choose topics to exclude in your AI", "start.check2": "Approve publishing on this site", "start.begin": "Let my agent pitch me", "start.demo": "Preview seeded flow", "start.duration": "Complete on your phone · about 3 minutes",
    "signin.step1": "STEP 1 / 2 · SIGN IN", "signin.step2": "STEP 2 / 2 · VERIFY", "signin.title": "Start with your email", "signin.verifyTitle": "Check your email", "signin.intro": "Sign in so one owner controls the prompt, draft, pitch, and invitations.", "signin.sentTo": "A six-digit code was sent to", "signin.email": "Email", "signin.code": "Verification code", "signin.send": "Send verification code", "signin.verify": "Verify and continue", "signin.resend": "Resend code", "signin.change": "Change email", "signin.resendIn": "Resend available in {seconds}s", "signin.resendNow": "You can resend the code now", "signin.codeShort": "Enter the complete six-digit code.", "signin.codeWrong": "That code is incorrect. Edit it and try again; this verification is still active.", "signin.codeExpired": "This code expired. Send a new code.", "signin.sent": "Verification code sent", "signin.resent": "New verification code sent",
    "assistant.step": "STEP 1 / 3 · CHOOSE AI", "assistant.title": "Who knows you best?", "assistant.intro": "Choose the AI you think with most often and that can access the relevant context.", "assistant.selected": "Selected", "assistant.choose": "Choose", "assistant.create": "Create my prompt",
    "flow.backToAi": "Back to choose AI", "flow.backToHandoff": "Back to handoff", "flow.leaveMatches": "Leave and go to Matches", "flow.cancelEdit": "Cancel editing",
    "handoff.step": "STEP 2 / 3 · HAND OFF", "handoff.change": "Change AI", "handoff.beforeTitle": "Hand this to {ai}", "handoff.afterTitle": "Bring your pitch back", "handoff.ready": "Extraction prompt ready", "handoff.show": "Show full prompt", "handoff.hide": "Hide full prompt", "handoff.return": "Back from {ai}? Paste the JSON it gave you.", "handoff.paste": "Paste final JSON", "handoff.openAgain": "Open {ai} again", "handoff.copyAgain": "Copy prompt again", "handoff.loading": "Loading prompt…", "handoff.loadError": "The prompt is not ready. Go back and try again.", "handoff.explainer": "Your AI first shows a short preview and the topics it found that you may want to exclude. Reply once with the topic numbers, or keep all topics, then copy its next JSON-only reply.", "handoff.launchHelp": "Opens {ai} with the full prompt and also tries to copy it as a fallback.", "handoff.copy": "Copy prompt", "handoff.openChatgpt": "Open ChatGPT with my prompt", "handoff.openClaude": "Open Claude with my prompt", "handoff.share": "Share prompt to my AI", "handoff.promptCopied": "Prompt copied. Open your AI and paste it to continue.",
    "guide.1.title": "Read the short preview", "guide.1.body": "Your AI first replies with a short preview — do not copy this one.", "guide.2.title": "Choose topics to exclude", "guide.2.body": "Reply once with topic numbers, or reply none to keep everything.", "guide.3.title": "Copy the next reply", "guide.3.body": "Copy the next reply — it will be only JSON, starting with {.", "guide.4.title": "If the site shows an error", "guide.4.body": "Return to your AI, answer the one topic-exclusion question, and copy its next JSON-only reply.",
    "import.stepPaste": "STEP 3 / 3 · PASTE JSON", "import.stepEdit": "STEP 3 / 3 · VISUAL EDIT", "import.editingEyebrow": "EDITING YOUR PUBLISHED PITCH", "import.title": "Bring your pitch back", "import.intro": "The first AI preview is not the content to paste. Finish the topic decision, then paste the final JSON.", "import.jsonLabel": "Owner pitch JSON", "import.render": "Visual edit", "import.demo": "Load demo pitch", "import.demoCaption": "Sample data for demonstration.", "import.resume": "Resume computer draft", "import.editTitle": "Publish this pitch?", "import.editIntro": "This is the complete version PitchYourOwner will store. Tap any text to edit it, then confirm and upload from this page.", "import.pasteAgain": "Paste JSON again", "import.continue": "Confirm & upload", "import.addItem": "Add item", "import.removeItem": "Remove {label}",
    "review.step": "STEP 4 / 4 · REVIEW & PUBLISH", "review.title": "Publish this pitch?", "review.intro": "This is the complete version PitchYourOwner will store. This page is read-only; go back to make changes.", "review.name": "Display name", "review.nameHint": "Shown to a match before you connect. Use a first name or handle.", "review.back": "Back to edit", "review.publish": "Confirm & upload", "review.publishChanges": "Publish changes", "review.publishing": "Publishing…",
    "field.history_scope": "History scope", "field.summary": "Summary", "field.interests": "Interests", "field.motivations": "Motivations", "field.active_problems": "Active problems", "field.recurring_topics": "Recurring topics", "field.friend_intent": "Friend intent", "hint.history_scope": "What the AI could and could not access", "hint.summary": "One concrete owner pitch", "hint.interests": "One specific, sustained interest per line", "hint.motivations": "One current motivation per line", "hint.active_problems": "One problem still in progress per line", "hint.recurring_topics": "One recurring discussion topic per line", "hint.friend_intent": "Who you hope to meet and what you want to discuss", "field.confidence": "confidence",
    "profile.scope": "History scope", "profile.conversation": "Conversation-derived", "profile.approved": "Owner-approved", "profile.exploring": "Currently exploring", "profile.notVerified": "Not verified",
    "pitch.loading": "Loading your pitch", "pitch.title": "My Pitch", "pitch.approved": "Owner-approved introduction", "pitch.emptyEyebrow": "MY PITCH", "pitch.emptyTitle": "No pitch yet", "pitch.emptyBody": "Ask your AI to create an owner pitch, then bring it back and publish it.", "pitch.create": "Create my pitch", "pitch.new": "Create a new pitch", "pitch.newHint": "Your agent writes a fresh pitch. Your current pitch stays live until you publish the new one.", "pitch.edit": "Edit", "pitch.draftChoiceTitle": "You already have a draft", "pitch.draftChoiceBody": "Resume it, or replace it with your currently published pitch.", "pitch.resumeDraft": "Resume your draft", "pitch.editPublished": "Edit published pitch",
    "matches.loading": "Looking for specific overlap", "matches.eyebrow": "MATCHES", "matches.searchingEyebrow": "MATCHES · SEARCHING", "matches.searchingTitle": "Your agent is looking", "matches.searchingBody": "It is comparing your pitch with other owners. This usually takes under a minute.", "matches.checking": "Checking again in {seconds}s", "matches.paused": "Matching paused", "matches.pausedBody": "We cannot check for new matches right now. Your pitch is safely saved.", "matches.emptyTitle": "No suitable match yet", "matches.emptyBody": "There is no match with a concrete reason yet. Matching runs again whenever a new owner publishes.", "matches.check": "Check again", "matches.title": "Matches", "matches.intro": "A small number of specific, explainable friend matches.", "matches.found": "{count} match{suffix} found", "matches.demoPassed": "Demo match passed", "matches.demoPassedBody": "This decision is recorded and cannot be undone. Ren H. is not notified and will not be suggested again.",
    "match.back": "Back to matches", "match.loading": "Opening match reason", "match.ownerPitch": "Owner pitch", "match.viewDetail": "See details", "match.score": "Similarity {score} / 100", "match.q1": "01 · What we both care about", "match.q2": "02 · Same reason, right now", "match.q3": "03 · What we could discuss today", "match.evidence": "Evidence · {label}", "match.connected": "You are connected", "match.start": "Start with this", "match.waiting": "Waiting for Ren H.", "match.simulate": "Demo · Simulate Ren accepting", "match.sent": "Invitation sent. Contact appears only after mutual acceptance.", "match.passed": "Passed. This decision is recorded and cannot be undone; they are not told.", "match.passConfirmTitle": "Pass on {name}?", "match.passConfirmBody": "This cannot be undone. They are not told.", "match.confirmPass": "Confirm pass", "match.notNow": "Not now", "match.accept": "Accept", "match.invite": "Send invitation", "match.unavailable": "Unavailable", "match.unavailableBody": "Match unavailable", "match.demoData": "Demo · simulated data", "match.fixtureOnly": "This test profile is visible only to you and cannot receive an invitation.", "match.demoAcceptance": "Demo · simulated acceptance", "match.demoSent": "Demo invitation sent", "match.demoAccepted": "Demo · Ren H. simulated acceptance", "match.passNotice": "Passed. They are not told.",
    "invites.loading": "Loading invitations", "invites.title": "Invitations", "invites.incoming": "Incoming", "invites.outgoing": "Outgoing", "invites.connected": "Connected", "invites.empty": "No items yet", "demo.marker": "Demo", "demo.simulated": "Demo · simulated",
    "settings.title": "Settings", "settings.intro": "Account, matching, and Computer API.", "settings.computer": "Computer API", "settings.upload": "24-hour draft upload", "settings.uploadHint": "Single-use and write-only; it can only create a draft", "settings.create": "Create", "settings.submitUrl": "Submit URL", "settings.token": "Bearer token · {expires}", "settings.tokenHint": "This token is shown only on this screen. POST body:", "settings.data": "Data", "settings.delete": "Delete pitch and account data", "settings.deleteAction": "Delete", "settings.signout": "Sign out on this device", "settings.signoutAction": "Sign out", "settings.info": "Information", "settings.privacy": "Privacy", "settings.terms": "Terms", "settings.support": "Support", "settings.language": "Language",
    "info.back": "Back to settings", "privacy.body": "PitchYourOwner stores only the owner pitch you explicitly publish, account and session records, matches, and invitation decisions. Your selected AI prepares the content before transfer.", "terms.body": "Owner pitches are conversation-derived interpretations, not verified identity or expertise. Use the product respectfully and do not upload information you are not authorized to share.", "support.body": "Send the exact error message and what you were trying to do. Do not include your profile JSON, upload token, verification code, or other secrets.", "support.sent": "Support request {id} was sent.", "support.another": "Send another request", "support.message": "Message", "support.messagePlaceholder": "What happened, what you expected, and the approximate time", "support.contact": "Contact (optional)", "support.contactPlaceholder": "Email or another way to reply", "support.send": "Send support request", "support.sending": "Sending…",
    "error.session": "Your session ended. Sign in again; your draft is safely saved on this device.", "error.rateVerification": "Too many code requests. Try again in {wait}, or use another email.", "error.rateGeneric": "That happened too often. Please wait and try again.", "error.supportLimit": "You have reached today’s support-request limit. Please try later.", "error.matchMissing": "This match cannot be found and may have expired.", "error.peerMissing": "This match cannot be opened and may have expired.", "error.matchExpired": "This match expired and can no longer be answered.", "error.decisionRecorded": "You already made a decision for this match. It cannot be changed.", "error.invitation": "This invitation action could not be completed. Return to Matches and try again.", "error.publishFirst": "Publish an owner pitch before starting matching.", "error.profileMissing": "You have not published an owner pitch yet.", "error.versionMissing": "This pitch version cannot be found.", "error.publish": "Your pitch could not be published. The draft is safe; please try again.", "error.publishPayload": "This pitch is not ready to publish. Go back, check the fields, and try again.", "error.pairing": "Matches cannot be loaded right now. Please try again.", "error.matching": "Matching could not start. Your pitch is saved; please try again.", "error.codeSend": "The verification code could not be sent. Please try again.", "error.codeConfirm": "This code could not be verified. Please try again.", "error.codeCombined": "The code is incorrect or expired. Check it or send a new one.", "error.emailDisabled": "Verification email is unavailable right now. Please try later.", "error.profileLoad": "Your pitch cannot be loaded right now. Please try again.", "error.draftLoad": "Your computer draft cannot be loaded right now. Please try again.", "error.matchingUnavailable": "New matches cannot be checked right now. Please try again.", "error.generic": "Something went wrong. Please try again.", "error.offline": "PitchYourOwner cannot be reached; this device may be offline.", "error.prompt": "The prompt could not be loaded. Go back and try again.", "action.signin": "Sign in again", "action.matches": "Back to matches", "action.createPitch": "Create my pitch", "action.changeEmail": "Change email", "action.backForm": "Back to form", "action.resend": "Resend code",
    "validation.json": "JSON must contain one profile object.", "validation.unknown": "The JSON contains unsupported fields. Paste only the final owner pitch JSON from your AI.", "validation.array": "{label} must contain at least one text item.", "validation.maxItems": "{label} can contain at most {count} items.", "validation.itemLong": "One {label} item is too long.", "validation.required": "{label} cannot be blank.", "validation.maxLength": "{label} can contain at most {count} characters.", "validation.confidenceMissing": "Field confidence data is missing.", "validation.confidence": "{label} confidence must be {levels}.", "validation.name": "Display name must be 1–40 characters with no line break.", "validation.notJson": "This is not importable final JSON. Return to your AI, answer the one topic-exclusion question, and copy its next JSON-only reply.", "validation.debug": "This looks like debug or transport data, not your Owner Pitch. Copy only the final JSON reply from your AI.", "validation.preview": "This is preview content, not final JSON. Answer the one topic-exclusion question, then paste the next JSON-only reply.",
    "confirm.delete": "Delete this pitch, its matches, and account data?", "notice.published": "Pitch published. Matching started.", "notice.publishedMatchingPending": "Pitch published. Matching is getting ready; open Matches to try again.", "notice.decisionPassed": "Passed. They are not told.", "notice.connected": "You both accepted. Contact details are now available.", "notice.invited": "Invitation sent.", "notice.computerNone": "No computer draft is available yet.", "notice.computerLoaded": "Computer draft loaded. Review every field before publishing.", "notice.clipboardUnavailable": "This browser cannot share or copy the prompt. Long-press the prompt to copy it manually.", "notice.promptMissing": "The prompt is not ready. Please try again.", "notice.copyUnavailable": "This browser cannot copy the prompt. Long-press it to copy manually.", "notice.shareCopied": "Prompt copied. Paste it into the AI you chose.",
    "error.challengeMissing": "This verification ended. Send a new code.", "error.invalidCode": "Enter the complete six-digit code.", "profile.fieldFallback": "Profile field", "time.hour": "{count} hr", "time.minute": "{count} min", "time.second": "{count} sec", "confidence.high": "High", "confidence.medium": "Medium", "confidence.low": "Low", "state.suggested": "Suggested", "state.incoming": "Incoming", "state.outgoing": "Waiting", "state.connected": "Connected", "state.not_now": "Passed", "state.unavailable": "Unavailable", "assistant.other": "Other AI", "prompt.aria": "Full extraction prompt", "progress.aria": "Step {step} of 3", "support.help": "Something not working?", "json.placeholder": "{ \"summary\": \"...\" }", "handoff.shareTitle": "PitchYourOwner profile prompt",
    "demo.profile.summary": "Portrait photographer exploring how subtle posture and direction change the emotion of a frame.", "demo.profile.interest1": "Subject direction", "demo.profile.interest2": "Posture and tension", "demo.profile.interest3": "Low-light portraiture", "demo.profile.interest4": "Film emulation", "demo.profile.motivation": "Create portraits that feel natural without leaving the subject unsupported", "demo.profile.problem": "Directing a stranger clearly in under 90 seconds", "demo.profile.topic1": "Shoulder-line cues", "demo.profile.topic2": "Skin tone under mixed light", "demo.profile.topic3": "Pre-shoot briefing", "demo.profile.intent": "Someone who practises the same problem weekly, such as a dancer, director, or photographer.", "demo.profile.scope": "Recent ChatGPT conversations and saved memory were available; voice chats and deleted conversations were not available.",
    "demo.peer.summary": "Contemporary dancer studying how small changes in posture and tension alter emotional expression.", "demo.peer.interest1": "Posture and tension", "demo.peer.interest2": "Choreographic direction", "demo.peer.interest3": "Movement under low light", "demo.peer.motivation": "Help performers communicate emotion without over-directing them", "demo.peer.problem": "Giving a useful physical cue without breaking a performer’s momentum", "demo.peer.topic1": "Shoulder-line cues", "demo.peer.topic2": "Breath before movement", "demo.peer.topic3": "Gesture intensity", "demo.peer.intent": "Someone testing how small cues change what an audience feels.", "demo.match.shared": "How posture and tension carry emotion — yours through a lens, Ren’s through a body.", "demo.match.now": "You are both trying to direct a person clearly without over-directing them.", "demo.match.discuss": "Ren is testing shoulder-line cues in low light while you are rewriting a 90-second pre-shoot brief.",
  },
  "zh-Hant": {
    "skip": "跳到主要內容", "nav.label": "主要導覽", "nav.matches": "配對", "nav.invites": "邀請", "nav.pitch": "我的介紹", "nav.settings": "設定",
    "language.switch": "EN", "language.current": "繁體中文", "account": "帳號", "common.loading": "處理中…", "common.try": "再試一次", "common.cancel": "取消",
    "start.title": "你的 Agent<br>了解你。<span>讓它介紹你。</span>", "start.promise": "認識一位此刻因相同理由、關心相同事情的人。", "start.checkpoints": "兩個 owner 確認關卡", "start.check1": "在 AI 選擇要排除的主題", "start.check2": "在網站授權發布", "start.begin": "讓我的 Agent 介紹我", "start.demo": "預覽示範流程", "start.duration": "手機可完成 · 約 3 分鐘",
    "signin.step1": "步驟 1 / 2 · 登入", "signin.step2": "步驟 2 / 2 · 驗證", "signin.title": "先用 Email 登入", "signin.verifyTitle": "查看你的 Email", "signin.intro": "登入後，prompt、草稿、介紹與邀請都由同一位 owner 控制。", "signin.sentTo": "六位數驗證碼已寄到", "signin.email": "Email", "signin.code": "驗證碼", "signin.send": "寄送驗證碼", "signin.verify": "驗證並繼續", "signin.resend": "重新寄送驗證碼", "signin.change": "更改 Email", "signin.resendIn": "{seconds} 秒後可重新寄送", "signin.resendNow": "現在可以重新寄送驗證碼", "signin.codeShort": "請輸入完整的六位數驗證碼。", "signin.codeWrong": "驗證碼不正確。請修改後再試；這次驗證仍然有效。", "signin.codeExpired": "這組驗證碼已到期。請重新寄送一組新的代碼。", "signin.sent": "驗證碼已寄出", "signin.resent": "新的驗證碼已寄出",
    "assistant.step": "步驟 1 / 3 · 選擇 AI", "assistant.title": "哪個 AI 最了解你？", "assistant.intro": "選擇平常最常一起思考、且能存取相關脈絡的 AI。", "assistant.selected": "已選擇", "assistant.choose": "選擇", "assistant.create": "建立我的 Prompt",
    "flow.backToAi": "返回選擇 AI", "flow.backToHandoff": "返回交接 Prompt", "flow.leaveMatches": "離開並前往配對", "flow.cancelEdit": "取消編輯",
    "handoff.step": "步驟 2 / 3 · 交給 AI", "handoff.change": "更改 AI", "handoff.beforeTitle": "把這份 Prompt 交給 {ai}", "handoff.afterTitle": "把介紹帶回來", "handoff.ready": "擷取 Prompt 已準備好", "handoff.show": "顯示完整 Prompt", "handoff.hide": "收合完整 Prompt", "handoff.return": "從 {ai} 回來了嗎？貼上它給你的 JSON。", "handoff.paste": "貼上最終 JSON", "handoff.openAgain": "再次開啟 {ai}", "handoff.copyAgain": "再次複製 Prompt", "handoff.loading": "正在載入 Prompt…", "handoff.loadError": "Prompt 尚未完成載入，請返回上一步再試。", "handoff.explainer": "AI 會先顯示簡短預覽，並列出你可能想排除的具體主題。一次回覆要排除的編號，或回覆全部保留，再複製它的下一則純 JSON。", "handoff.launchHelp": "將完整 Prompt 帶入 {ai} 並開啟，也會嘗試複製到剪貼簿作為備援。", "handoff.copy": "複製 Prompt", "handoff.openChatgpt": "用我的 Prompt 開啟 ChatGPT", "handoff.openClaude": "用我的 Prompt 開啟 Claude", "handoff.share": "把 Prompt 分享到我的 AI", "handoff.promptCopied": "Prompt 已複製，請開啟 AI 並貼上以繼續。",
    "guide.1.title": "先閱讀簡短預覽", "guide.1.body": "AI 會先回一段簡短預覽 — 這一則不要複製。", "guide.2.title": "選擇要排除的主題", "guide.2.body": "只要回覆一次：輸入要排除的編號，或回覆 none 保留全部。", "guide.3.title": "複製下一則回答", "guide.3.body": "複製下一則回答 — 它只會是 JSON，以 { 開頭。", "guide.4.title": "如果網站顯示錯誤", "guide.4.body": "回到 AI 回答一次主題排除問題，再複製它輸出的下一則純 JSON。",
    "import.stepPaste": "步驟 3 / 3 · 貼上 JSON", "import.stepEdit": "步驟 3 / 3 · 視覺化編輯", "import.editingEyebrow": "編輯已發布的介紹", "import.title": "把你的介紹帶回來", "import.intro": "AI 的第一則預覽不是要貼的內容。先選好要排除的主題，再貼上最終 JSON。", "import.jsonLabel": "Owner Pitch JSON", "import.render": "視覺化編輯", "import.demo": "載入示範介紹", "import.demoCaption": "示範用資料。", "import.resume": "接續電腦草稿", "import.editTitle": "要發布這份介紹嗎？", "import.editIntro": "這是 PitchYourOwner 將儲存的完整版本。點文字即可直接修改，完成後從本頁確認並上傳。", "import.pasteAgain": "重新貼上 JSON", "import.continue": "確認並上傳", "import.addItem": "新增一項", "import.removeItem": "刪除{label}",
    "review.step": "步驟 4 / 4 · 審核與發布", "review.title": "要發布這份介紹嗎？", "review.intro": "這是 PitchYourOwner 將儲存的完整版本。本頁只能閱讀；若要修改請返回。", "review.name": "顯示名稱", "review.nameHint": "連結前會顯示給配對對象。請使用名字或暱稱。", "review.back": "返回編輯", "review.publish": "確認並上傳", "review.publishChanges": "發布修改", "review.publishing": "發布中…",
    "field.history_scope": "歷史範圍", "field.summary": "摘要", "field.interests": "興趣", "field.motivations": "動機", "field.active_problems": "目前問題", "field.recurring_topics": "反覆主題", "field.friend_intent": "交友意圖", "hint.history_scope": "AI 實際使用與無法存取的資料範圍", "hint.summary": "一句具體的 owner pitch", "hint.interests": "每行一個具體、持續關注的興趣", "hint.motivations": "每行一個目前重要的動機", "hint.active_problems": "每行一個仍在處理的問題", "hint.recurring_topics": "每行一個反覆討論的主題", "hint.friend_intent": "希望認識怎樣的人，以及想聊什麼", "field.confidence": "信心",
    "profile.scope": "歷史範圍", "profile.conversation": "源自對話", "profile.approved": "Owner 已核准", "profile.exploring": "目前正在探索", "profile.notVerified": "未經驗證",
    "pitch.loading": "正在載入你的介紹", "pitch.title": "我的介紹", "pitch.approved": "我的介紹 · owner 已核准", "pitch.emptyEyebrow": "我的介紹", "pitch.emptyTitle": "尚未建立介紹", "pitch.emptyBody": "先讓你的 AI 產生 owner pitch，再貼回並發布。", "pitch.create": "建立我的介紹", "pitch.new": "建立新的介紹", "pitch.newHint": "你的 Agent 會重新撰寫一份介紹。在你發布新版之前，目前的介紹仍會繼續運作。", "pitch.edit": "編輯", "pitch.draftChoiceTitle": "你已有一份草稿", "pitch.draftChoiceBody": "你可以接續草稿，或改用目前已發布的介紹開始編輯。", "pitch.resumeDraft": "接續草稿", "pitch.editPublished": "編輯已發布的介紹",
    "matches.loading": "正在尋找具體重疊", "matches.eyebrow": "配對", "matches.searchingEyebrow": "配對 · 搜尋中", "matches.searchingTitle": "你的 Agent 正在尋找", "matches.searchingBody": "正在把你的介紹與其他 owners 比較。通常一分鐘內就能完成。", "matches.checking": "{seconds} 秒後再次檢查", "matches.paused": "配對已暫停", "matches.pausedBody": "目前無法檢查新配對。你的介紹已安全保存。", "matches.emptyTitle": "找不到合適的配對", "matches.emptyBody": "目前還沒有能具體說明理由的配對。每當有新的 owner 發布介紹，系統會再次進行配對。", "matches.check": "再次檢查", "matches.title": "配對", "matches.intro": "少量、具體、可以解釋的朋友配對。", "matches.found": "找到 {count} 個配對", "matches.demoPassed": "已略過示範配對", "matches.demoPassedBody": "這個決定已記錄且無法復原；Ren H. 不會收到通知，也不會再次被推薦。",
    "match.back": "返回配對", "match.loading": "正在開啟配對理由", "match.ownerPitch": "Owner 介紹", "match.viewDetail": "查看詳細介紹", "match.score": "相似度 {score} / 100", "match.q1": "01 · 我們都關心什麼", "match.q2": "02 · 此刻出於相同理由", "match.q3": "03 · 今天可以聊什麼", "match.evidence": "依據 · {label}", "match.connected": "你們已連結", "match.start": "可以這樣開場", "match.waiting": "等待 Ren H. 回覆", "match.simulate": "Demo · 模擬 Ren 接受", "match.sent": "邀請已送出。只有雙方接受後才會顯示聯絡方式。", "match.passed": "已略過。此決定已記錄且無法復原；對方不會收到通知。", "match.passConfirmTitle": "略過 {name}？", "match.passConfirmBody": "此決定無法復原，對方不會收到通知。", "match.confirmPass": "確認略過", "match.notNow": "現在不要", "match.accept": "接受", "match.invite": "寄送邀請", "match.unavailable": "無法使用", "match.unavailableBody": "配對目前無法使用", "match.demoData": "Demo · 模擬資料", "match.fixtureOnly": "這是只提供給你的測試 profile，不會寄出邀請。", "match.demoAcceptance": "Demo · 模擬接受", "match.demoSent": "Demo 邀請已送出", "match.demoAccepted": "Demo · Ren H. 已模擬接受", "match.passNotice": "已略過，對方不會收到通知。",
    "invites.loading": "正在載入邀請", "invites.title": "邀請", "invites.incoming": "收到的邀請", "invites.outgoing": "送出的邀請", "invites.connected": "已連結", "invites.empty": "目前沒有項目", "demo.marker": "Demo", "demo.simulated": "Demo · 模擬",
    "settings.title": "設定", "settings.intro": "帳號、配對與 Computer API。", "settings.computer": "Computer API", "settings.upload": "24 小時草稿上傳", "settings.uploadHint": "單次、只能寫入，而且只能建立草稿", "settings.create": "建立", "settings.submitUrl": "提交網址", "settings.token": "Bearer token · {expires}", "settings.tokenHint": "Token 只顯示於目前畫面。POST body：", "settings.data": "資料", "settings.delete": "刪除介紹與帳號資料", "settings.deleteAction": "刪除", "settings.signout": "在這台裝置登出", "settings.signoutAction": "登出", "settings.info": "資訊", "settings.privacy": "隱私", "settings.terms": "使用條款", "settings.support": "支援", "settings.language": "語言",
    "info.back": "返回設定", "privacy.body": "PitchYourOwner 只儲存你明確發布的 owner pitch、帳號與 session 紀錄、配對和邀請決定。內容傳輸前由你選擇的 AI 處理。", "terms.body": "Owner pitch 是根據對話產生的解讀，不是經驗證的身分或專業能力。請尊重他人，也不要上傳你無權分享的資訊。", "support.body": "請提供完整錯誤訊息與當時嘗試的操作。不要附上 profile JSON、upload token、驗證碼或其他秘密。", "support.sent": "支援請求 {id} 已送出。", "support.another": "再送一個請求", "support.message": "訊息", "support.messagePlaceholder": "發生什麼、你原本預期什麼，以及大約時間", "support.contact": "聯絡方式（選填）", "support.contactPlaceholder": "Email 或其他回覆方式", "support.send": "送出支援請求", "support.sending": "送出中…",
    "error.session": "登入階段已結束。請重新登入；你的草稿仍安全保存在這台裝置上。", "error.rateVerification": "驗證碼請求太頻繁。請在 {wait}後再試，或改用另一個 Email。", "error.rateGeneric": "操作太頻繁。請稍候再試。", "error.supportLimit": "今天送出的支援請求已達上限。請稍後再試。", "error.matchMissing": "找不到這個配對，可能已經失效。", "error.peerMissing": "這個配對目前無法開啟，可能已經失效。", "error.matchExpired": "這個配對已經到期，無法再回覆。", "error.decisionRecorded": "你已經對這個配對做過決定，無法再次更改。", "error.invitation": "這個邀請操作無法完成。請返回配對後再試。", "error.publishFirst": "請先發布 owner pitch，才能開始配對。", "error.profileMissing": "你還沒有發布 owner pitch。", "error.versionMissing": "找不到這個 pitch 版本。", "error.publish": "目前無法發布你的介紹。草稿仍在，請再試一次。", "error.publishPayload": "這份介紹還不能發布。請返回檢查欄位後再試。", "error.pairing": "目前無法載入配對，請再試一次。", "error.matching": "目前無法開始配對。你的介紹已保存，請再試一次。", "error.codeSend": "目前無法寄出驗證碼，請再試一次。", "error.codeConfirm": "目前無法驗證這組代碼，請再試一次。", "error.codeCombined": "驗證碼不正確或已到期。請檢查代碼，或重新寄送。", "error.emailDisabled": "目前無法寄送驗證信。請稍後再試。", "error.profileLoad": "目前無法載入你的介紹，請再試一次。", "error.draftLoad": "目前無法載入電腦草稿，請再試一次。", "error.matchingUnavailable": "目前無法檢查新配對，請再試一次。", "error.generic": "發生問題，請再試一次。", "error.offline": "無法連上 PitchYourOwner；這台裝置可能已離線。", "error.prompt": "無法載入 Prompt。請返回上一步再試。", "action.signin": "重新登入", "action.matches": "返回配對", "action.createPitch": "建立我的介紹", "action.changeEmail": "更改 Email", "action.backForm": "返回表單", "action.resend": "重新寄送驗證碼",
    "validation.json": "JSON 必須包含一個 profile object。", "validation.unknown": "JSON 包含不支援的欄位。請只貼上 AI 最後輸出的 owner pitch JSON。", "validation.array": "{label} 必須包含至少一項文字。", "validation.maxItems": "{label} 最多 {count} 項。", "validation.itemLong": "{label} 有一項文字過長。", "validation.required": "{label} 不可空白。", "validation.maxLength": "{label} 最多 {count} 字元。", "validation.confidenceMissing": "缺少欄位信心資料。", "validation.confidence": "{label} 的信心只能是 {levels}。", "validation.name": "顯示名稱必須是 1–40 字元，而且不能換行。", "validation.notJson": "這不是可匯入的最終 JSON。請回到 AI，回答一次「哪些主題應該排除？」，再複製下一則純 JSON。", "validation.debug": "這看起來是除錯／傳輸資料，不是你的 Owner Pitch。請只複製 AI 最後輸出的純 JSON。", "validation.preview": "這是預覽內容，不是最終 JSON。回答一次主題排除問題後，再貼上下一則純 JSON。",
    "confirm.delete": "要刪除這份介紹、相關配對與帳號資料嗎？", "notice.published": "介紹已發布，配對已開始。", "notice.publishedMatchingPending": "介紹已發布，配對準備中；前往配對頁即可再次檢查。", "notice.decisionPassed": "已略過，對方不會收到通知。", "notice.connected": "雙方已接受，聯絡方式已開放。", "notice.invited": "邀請已送出。", "notice.computerNone": "目前沒有可接續的電腦草稿。", "notice.computerLoaded": "電腦草稿已載入。發布前請審核每個欄位。", "notice.clipboardUnavailable": "這個瀏覽器無法分享或複製 Prompt，請長按 Prompt 手動複製。", "notice.promptMissing": "Prompt 尚未完成載入，請稍後再試。", "notice.copyUnavailable": "這個瀏覽器無法複製 Prompt，請長按手動複製。", "notice.shareCopied": "Prompt 已複製，請貼到你選擇的 AI。",
    "error.challengeMissing": "這次驗證已結束，請重新寄送驗證碼。", "error.invalidCode": "請輸入完整的六位數驗證碼。", "profile.fieldFallback": "介紹欄位", "time.hour": "{count} 小時", "time.minute": "{count} 分鐘", "time.second": "{count} 秒", "confidence.high": "高", "confidence.medium": "中", "confidence.low": "低", "state.suggested": "建議認識", "state.incoming": "收到邀請", "state.outgoing": "等待回覆", "state.connected": "已連結", "state.not_now": "已略過", "state.unavailable": "無法使用", "assistant.other": "其他 AI", "prompt.aria": "完整擷取 Prompt", "progress.aria": "步驟 {step} / 3", "support.help": "遇到問題？", "json.placeholder": "{ \"summary\": \"...\" }", "handoff.shareTitle": "PitchYourOwner 個人介紹 Prompt",
    "demo.profile.summary": "人像攝影師，正在探索細微姿勢與引導如何改變畫面情緒。", "demo.profile.interest1": "人物引導", "demo.profile.interest2": "姿勢與張力", "demo.profile.interest3": "低光人像", "demo.profile.interest4": "底片色彩模擬", "demo.profile.motivation": "拍出自然的人像，同時不讓被攝者失去明確引導", "demo.profile.problem": "在 90 秒內清楚引導第一次見面的人", "demo.profile.topic1": "肩線提示", "demo.profile.topic2": "混合光源下的膚色", "demo.profile.topic3": "拍攝前說明", "demo.profile.intent": "每週都在練習同類問題的人，例如舞者、導演或攝影師。", "demo.profile.scope": "可使用近期 ChatGPT 對話與已儲存記憶；無法使用語音聊天與已刪除對話。",
    "demo.peer.summary": "當代舞者，研究細微姿勢與張力變化如何改變情緒表達。", "demo.peer.interest1": "姿勢與張力", "demo.peer.interest2": "編舞引導", "demo.peer.interest3": "低光下的動作", "demo.peer.motivation": "協助表演者傳達情緒，同時避免過度指導", "demo.peer.problem": "給出有用的肢體提示，同時不打斷表演者的動勢", "demo.peer.topic1": "肩線提示", "demo.peer.topic2": "動作前的呼吸", "demo.peer.topic3": "手勢強度", "demo.peer.intent": "正在測試細微提示如何改變觀眾感受的人。", "demo.match.shared": "你們都關注姿勢與張力如何承載情緒——你透過鏡頭，Ren 透過身體。", "demo.match.now": "你們此刻都在嘗試清楚引導一個人，同時避免過度指導。", "demo.match.discuss": "Ren 正在低光下測試肩線提示，而你正在重寫 90 秒拍攝前說明。",
  },
};

Object.assign(COPY["zh-Hant"], {
  "handoff.explainer": "AI 會先整理一份專業亮點預覽，列出擬公開的具體主題，並一次問你哪些要排除。回覆編號，或回覆 none／全部保留；下一則就是可貼回的 JSON。",
  "guide.1.title": "閱讀專業亮點預覽",
  "guide.1.body": "AI 第一則先顯示介紹與擬公開主題，這一則不用複製。",
  "guide.2.title": "一次選擇要排除的主題",
  "guide.2.body": "回覆要排除的編號；若全部保留，回覆 none 或全部保留。",
  "guide.3.title": "複製下一則 JSON",
  "guide.3.body": "下一則只會有 JSON，從 { 開始、以 } 結束。",
  "guide.4.title": "若格式有錯",
  "guide.4.body": "依照欄位旁的語法或 schema 錯誤修正後再試，原始文字會保留。",
  "import.intro": "貼上 AI 在你選好排除主題後產生的 JSON。網站會檢查格式，接著讓你編輯與最終確認。",
  "field.animal_persona": "動物角色",
  "hint.animal_persona": "用鮮明、尊重且與專業特質相關的動物隱喻讓人記住你",
  "validation.syntax": "JSON 語法錯誤：{detail}",
  "validation.smartQuotes": "偵測到智慧引號，已嘗試安全轉換；仍有語法錯誤：{detail}",
  "validation.json": "內容必須是一個 JSON profile 物件。",
  "validation.unknown": "JSON 含有 schema 未支援的欄位，請移除後再試。",
  "validation.notJson": "無法解析 JSON，請依下方語法錯誤修正後再試。",
  "validation.debug": "這是系統訊息物件，不是 profile schema。",
  "validation.preview": "這是文字預覽，不是可解析的 profile JSON。",
  "validation.duplicateKey": "JSON 有重複欄位：{key}",
  "validation.trailing": "JSON 前後不能包含說明文字或第二個物件。",
  "validation.duplicateItem": "{label} 不能包含重複項目。",
  "matches.refresh": "重新整理配對",
  "matches.page": "第 {page} / {total} 頁",
  "matches.previous": "上一頁",
  "matches.next": "下一頁",
  "matches.total": "共 {count} 位可能值得認識的人",
  "settings.visibility": "公開狀態",
  "settings.public": "公開 — 可出現在建議配對",
  "settings.private": "私人 — 只有我",
  "settings.privateWarning": "切換為私人後會立即停止配對與新邀請；公開連結只顯示不公開通知。已分享至第三方的截圖或快取無法收回。",
  "settings.publicLink": "公開介紹網址",
  "landing.flow": "AI 整理介紹 → 你審核 → 看建議的人 → 發出邀請 → 雙方同意後交換 Email",
  "landing.animals": "你的 AI 會依你的專業、技能與做事方式，替你生成專屬動物角色。每個人都會不同。",
  "accept.loading": "正在載入邀請",
  "accept.title": "有人想認識你",
  "accept.accept": "接受這次介紹",
  "accept.notNow": "現在不要",
  "accept.note": "只有按下按鈕才會送出決定。開啟這一頁不會自動接受。",
  "accept.done": "已記錄你的決定",
  "connection.title": "你們都接受了",
  "connection.email": "對方的 Email",
  "connection.open": "查看聯絡方式",
  "connection.aiEyebrow": "第一封信",
  "connection.aiTitle": "請 AI 幫你寫第一封信",
  "connection.aiBody": "把雙方已核准的介紹交給 AI，產生可以直接寄出的開場信。",
  "connection.chatgpt": "用 ChatGPT 寫信",
  "connection.claude": "用 Claude 寫信",
  "connection.promptOpened": "已在新分頁開啟 {ai}，完整 Prompt 也已複製。這一頁會保留。",
  "connection.promptManual": "已在新分頁開啟 {ai}，但瀏覽器沒有允許自動複製。完整 Prompt 已顯示在本頁下方。",
  "connection.promptFallbackTitle": "手動複製完整 Prompt",
  "connection.promptFallbackBody": "長按或全選下方內容，複製後貼到剛開啟的 AI 分頁。",
  "memory.title": "先開啟 {ai} 的記憶功能",
  "memory.body": "開啟記憶後，{ai} 才能使用你已授權且實際可存取的對話與記憶，整理出更具體的介紹。",
  "memory.limit": "若你的帳號沒有這個功能，也可以稍後再設定；AI 仍可根據目前可用的對話內容整理介紹。",
  "memory.confirm": "我已開啟記憶",
  "memory.later": "稍後再設定",
  "memory.close": "關閉記憶功能教學",
  "memory.reopen": "再次查看 {ai} Memory 教學",
  "memory.videoAlt": "在 {ai} 開啟記憶功能的操作示範",
  "handoff.openFallback": "沒有開啟？再次前往 {ai}",
  "handoff.openedCopied": "已在新分頁開啟 {ai}，Prompt 也已複製。完成後回到這一頁。",
  "handoff.openedManual": "已在新分頁開啟 {ai}。若 Prompt 沒有自動帶入，可在下方再次複製或展開完整 Prompt 手動複製。"
});

let activeLocale = "zh-Hant";

function t(key, variables = {}) {
  const template = COPY["zh-Hant"][key] ?? key;
  return Object.entries(variables).reduce((value, [name, replacement]) => value.replaceAll(`{${name}}`, String(replacement)), template);
}
const FIELD_META = {
  history_scope: ["field.history_scope", "hint.history_scope"],
  animal_persona: ["field.animal_persona", "hint.animal_persona"],
  summary: ["field.summary", "hint.summary"],
  interests: ["field.interests", "hint.interests"],
  motivations: ["field.motivations", "hint.motivations"],
  active_problems: ["field.active_problems", "hint.active_problems"],
  recurring_topics: ["field.recurring_topics", "hint.recurring_topics"],
  friend_intent: ["field.friend_intent", "hint.friend_intent"],
};
let FIELD_ORDER = ["history_scope", "animal_persona", "summary", "interests", "motivations", "active_problems", "recurring_topics", "friend_intent"];
const DEMO_MATCH_ID = "demo-ren-h";
const DEMO_CONNECTION_ID = "demo-ren-h";
const genericAnimal = "帶著好奇心探索的水獺";

function sampleProfile() {
  return {
  animal_persona: "追著光線的銀狐",
  summary: t("demo.profile.summary"),
  interests: [t("demo.profile.interest1"), t("demo.profile.interest2"), t("demo.profile.interest3"), t("demo.profile.interest4")],
  motivations: [t("demo.profile.motivation")],
  active_problems: [t("demo.profile.problem")],
  recurring_topics: [t("demo.profile.topic1"), t("demo.profile.topic2"), t("demo.profile.topic3")],
  friend_intent: t("demo.profile.intent"),
  history_scope: t("demo.profile.scope"),
  confidence: { summary: "high", interests: "high", motivations: "medium", active_problems: "medium", recurring_topics: "medium", friend_intent: "low" },
  };
}

function demoMatch(saved = {}) {
  return {
  match_id: DEMO_MATCH_ID,
  connection_id: saved.connection_id || DEMO_CONNECTION_ID,
  state: saved.state || "suggested",
  peer: {
    display_name: "Ren H.",
    ...(saved.peer?.contact_email ? { contact_email: saved.peer.contact_email } : {}),
    profile: {
      animal_persona: "用腳尖讀懂情緒的粉色羊駝",
      summary: t("demo.peer.summary"),
      interests: [t("demo.peer.interest1"), t("demo.peer.interest2"), t("demo.peer.interest3")],
      motivations: [t("demo.peer.motivation")],
      active_problems: [t("demo.peer.problem")],
      recurring_topics: [t("demo.peer.topic1"), t("demo.peer.topic2"), t("demo.peer.topic3")],
      friend_intent: t("demo.peer.intent"),
    },
  },
  explanation: {
    what_we_both_care_about: t("demo.match.shared"),
    why_it_matters_now: t("demo.match.now"),
    what_we_could_discuss: t("demo.match.discuss"),
    evidence_labels: ["interests", "active_problems", "recurring_topics"],
  },
  can_invite: saved.can_invite ?? true,
  similarity_score: saved.similarity_score ?? 86,
  };
}

function demoFirstEmailPrompt() {
  const owner = sampleProfile();
  const peer = demoMatch().peer.profile;
  const publicOwner = Object.fromEntries(Object.entries(owner).filter(([key]) => !["history_scope", "confidence"].includes(key)));
  return `<PITCHYOUROWNER_FIRST_EMAIL>
<TASK>
請協助 A 寫第一封 Email 給剛在 PitchYourOwner 上互相接受介紹的 B。
</TASK>
<A_PROFILE>
${JSON.stringify(publicOwner, null, 2)}
</A_PROFILE>
<B_PROFILE>
${JSON.stringify(peer, null, 2)}
</B_PROFILE>
<MATCH_REASON>
${JSON.stringify(demoMatch().explanation, null, 2)}
</MATCH_REASON>
<INSTRUCTIONS>
使用繁體中文，以 A 的第一人稱撰寫。自然說明雙方是在 PitchYourOwner 上互相接受介紹後取得聯繫，具體說明為什麼想認識 B、現在值得交流的主題、一個容易回覆的問題與低壓力下一步。語氣自然、專業、有魅力；不要詢問其他問題。
</INSTRUCTIONS>
<OUTPUT_FORMAT>
主旨：《PitchYourOwner》{雙方最具體的交流主題}

內文：
{可以直接複製寄出的完整信件}
</OUTPUT_FORMAT>
</PITCHYOUROWNER_FIRST_EMAIL>`;
}
const SAVED_DEMO_MATCH = readJson(DEMO_MATCH_KEY);
const DEMO_QUERY_ENABLED = new URLSearchParams(location.search).has("demo");
const PERSISTED_DEMO_ENABLED = readJson(DEMO_KEY)?.enabled === true;
const DEMO_AVAILABLE = ["127.0.0.1", "localhost"].includes(location.hostname) || DEMO_QUERY_ENABLED || PERSISTED_DEMO_ENABLED;
const SAVED_DRAFT = readJson(DRAFT_KEY);
const SAVED_IMPORT_MODE = readJson(IMPORT_MODE_KEY);
const SAVED_DEMO_PROFILE = readJson(DEMO_PROFILE_KEY);
const SAVED_LAST_PUBLISH_AT = Number(readJson(LAST_PUBLISH_KEY)) || 0;
const SAVED_HANDOFF = readJson(HANDOFF_KEY);
const SAVED_AUTH_FLOW = readJson(AUTH_FLOW_KEY);
const SAVED_PUBLISH_ATTEMPT = readJson(PUBLISH_ATTEMPT_KEY);
const SAVED_LOCALE = readJson(LOCALE_KEY);
const INITIAL_LOCALE = "zh-Hant";
activeLocale = INITIAL_LOCALE;

const runtime = {
  session: readJson(STORAGE_KEY),
  draft: SAVED_DRAFT,
  draftMode: SAVED_DRAFT && readJson(DRAFT_MODE_KEY) === "edit-published" ? "edit-published" : SAVED_DRAFT ? "new" : null,
  importMode: SAVED_DRAFT && SAVED_IMPORT_MODE === "paste" ? "paste" : "edit",
  selectedAi: ["ChatGPT", "Claude", "Other AI"].includes(SAVED_HANDOFF?.selectedAi) ? SAVED_HANDOFF.selectedAi : "ChatGPT",
  locale: INITIAL_LOCALE,
  publishAttempt: SAVED_PUBLISH_ATTEMPT,
  challengeId: typeof SAVED_AUTH_FLOW?.challengeId === "string" ? SAVED_AUTH_FLOW.challengeId : null,
  signinEmail: typeof SAVED_AUTH_FLOW?.email === "string" ? SAVED_AUTH_FLOW.email : "",
  challengeExpiresAt: Number(SAVED_AUTH_FLOW?.expiresAt) || 0,
  resendAt: Number(SAVED_AUTH_FLOW?.resendAt) || 0,
  verificationCode: "",
  codeError: "",
  importJson: SAVED_DRAFT && SAVED_IMPORT_MODE === "paste" ? JSON.stringify(SAVED_DRAFT, null, 2) : "",
  prompt: typeof SAVED_HANDOFF?.prompt === "string" ? SAVED_HANDOFF.prompt : "",
  handoffLaunchedAt: Number(SAVED_HANDOFF?.launchedAt) || 0,
  memoryNoticeSeen: SAVED_HANDOFF?.memoryNoticeSeen && typeof SAVED_HANDOFF.memoryNoticeSeen === "object" ? SAVED_HANDOFF.memoryNoticeSeen : {},
  memoryNoticeOpen: Boolean(
    SAVED_HANDOFF?.prompt
      && ["ChatGPT", "Claude"].includes(SAVED_HANDOFF?.selectedAi)
      && !SAVED_HANDOFF?.memoryNoticeSeen?.[SAVED_HANDOFF?.selectedAi]
  ),
  memoryNoticeReturnAction: "launch-ai-with-prompt",
  showFullPrompt: false,
  busy: false,
  error: "",
  notice: "",
  profile: (DEMO_QUERY_ENABLED || PERSISTED_DEMO_ENABLED) && SAVED_DEMO_PROFILE?.profile ? SAVED_DEMO_PROFILE : (DEMO_QUERY_ENABLED || PERSISTED_DEMO_ENABLED) && SAVED_LAST_PUBLISH_AT ? { profile: sampleProfile(), profile_id: "demo-owner", version_id: "demo-v1" } : null,
  profileLoaded: Boolean((DEMO_QUERY_ENABLED || PERSISTED_DEMO_ENABLED) && (SAVED_DEMO_PROFILE?.profile || SAVED_LAST_PUBLISH_AT)),
  matches: null,
  matchResult: null,
  invitations: null,
  match: null,
  uploadSession: null,
  invitationPreview: null,
  invitationDecision: null,
  connection: null,
  connectionPromptFallback: false,
  supportRequestId: null,
  demo: DEMO_QUERY_ENABLED || PERSISTED_DEMO_ENABLED,
  demoDraft: readJson(DEMO_DRAFT_KEY) === true,
  demoMatch: demoMatch(SAVED_DEMO_MATCH?.match_id === DEMO_MATCH_ID ? SAVED_DEMO_MATCH : {}),
  pendingMatchDecision: null,
  pendingPitchEdit: false,
  homeRouting: false,
  profileLoading: false,
  lastPublishAt: SAVED_LAST_PUBLISH_AT,
  matchesPollError: false,
};

let matchesPollTimer = null;
let matchesCountdownTimer = null;
let nextMatchCheckAt = 0;
let otpCountdownTimer = null;

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}

function writeJson(key, value) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
}

function setDraftMode(mode) {
  runtime.draftMode = mode === "edit-published" ? "edit-published" : mode ? "new" : null;
  writeJson(DRAFT_MODE_KEY, runtime.draftMode);
}

function setImportMode(mode) {
  runtime.importMode = mode === "paste" ? "paste" : "edit";
  writeJson(IMPORT_MODE_KEY, runtime.importMode);
}

function clearDraftState() {
  runtime.draft = null;
  setDraftMode(null);
  setImportMode("edit");
  writeJson(IMPORT_MODE_KEY, null);
  writeJson(DRAFT_KEY, null);
  runtime.publishAttempt = null;
  writeJson(PUBLISH_ATTEMPT_KEY, null);
}

function invalidatePublishAttempt() {
  runtime.publishAttempt = null;
  writeJson(PUBLISH_ATTEMPT_KEY, null);
}

function publishAttemptForDraft() {
  const profileSnapshot = JSON.stringify(runtime.draft);
  if (runtime.publishAttempt?.profileSnapshot === profileSnapshot && runtime.publishAttempt?.idempotencyKey && runtime.publishAttempt?.approvedAt) {
    return runtime.publishAttempt;
  }
  runtime.publishAttempt = {
    profileSnapshot,
    idempotencyKey: crypto.randomUUID(),
    approvedAt: new Date().toISOString(),
  };
  writeJson(PUBLISH_ATTEMPT_KEY, runtime.publishAttempt);
  return runtime.publishAttempt;
}

function resetDemoMatch() {
  runtime.demoMatch = demoMatch();
  writeJson(DEMO_MATCH_KEY, runtime.demoMatch);
}

function saveDemoMatch() {
  writeJson(DEMO_MATCH_KEY, runtime.demoMatch);
}

function fieldLabel(field) {
  return t(FIELD_META[field]?.[0] || "profile.fieldFallback");
}

function fieldHint(field) {
  return t(FIELD_META[field]?.[1] || "profile.fieldFallback");
}

function confidenceLabel(level) {
  return t(`confidence.${level}`);
}

function matchStateLabel(state) {
  const key = `state.${state}`;
  return COPY["zh-Hant"][key] ?? String(state || "").replace(/_/g, " ");
}

function peerPresentationName(peer) {
  return peer?.animal_persona || peer?.profile?.animal_persona || peer?.display_name || genericAnimal;
}

function useLocale() {
  runtime.locale = "zh-Hant";
  activeLocale = runtime.locale;
  writeJson(LOCALE_KEY, runtime.locale);
  document.documentElement.lang = runtime.locale;
}

function preserveVisibleFormState() {
  const form = document.querySelector("form[data-form]");
  if (!form) return;
  const data = new FormData(form);
  if (form.dataset.form === "request-code") runtime.signinEmail = String(data.get("email") || "");
  if (form.dataset.form === "confirm-code") runtime.verificationCode = String(data.get("code") || "");
  if (form.dataset.form === "parse-json") runtime.importJson = String(data.get("json") || "");
}

async function switchLocale() {
  preserveVisibleFormState();
  useLocale();
  render();
}

function saveAuthFlow() {
  if (!runtime.challengeId) {
    writeJson(AUTH_FLOW_KEY, null);
    return;
  }
  writeJson(AUTH_FLOW_KEY, {
    challengeId: runtime.challengeId,
    email: runtime.signinEmail,
    expiresAt: runtime.challengeExpiresAt,
    resendAt: runtime.resendAt,
  });
}

function clearAuthFlow({ keepEmail = false } = {}) {
  clearInterval(otpCountdownTimer);
  otpCountdownTimer = null;
  runtime.challengeId = null;
  runtime.challengeExpiresAt = 0;
  runtime.resendAt = 0;
  runtime.verificationCode = "";
  runtime.codeError = "";
  if (!keepEmail) runtime.signinEmail = "";
  writeJson(AUTH_FLOW_KEY, null);
}

function clearHandoff() {
  runtime.prompt = "";
  runtime.handoffLaunchedAt = 0;
  runtime.memoryNoticeSeen = {};
  runtime.memoryNoticeOpen = false;
  runtime.memoryNoticeReturnAction = "launch-ai-with-prompt";
  runtime.showFullPrompt = false;
  writeJson(HANDOFF_KEY, null);
}

function saveHandoff() {
  writeJson(HANDOFF_KEY, {
    selectedAi: runtime.selectedAi,
    locale: runtime.locale,
    prompt: runtime.prompt,
    launchedAt: runtime.handoffLaunchedAt || null,
    memoryNoticeSeen: runtime.memoryNoticeSeen,
  });
}

function rehydrateHandoff() {
  const saved = readJson(HANDOFF_KEY);
  if (!saved) return;
  runtime.selectedAi = ["ChatGPT", "Claude", "Other AI"].includes(saved.selectedAi) ? saved.selectedAi : runtime.selectedAi;
  useLocale(["zh-Hant", "en"].includes(saved.locale) ? saved.locale : runtime.locale);
  runtime.prompt = typeof saved.prompt === "string" ? saved.prompt : runtime.prompt;
  runtime.handoffLaunchedAt = Number(saved.launchedAt) || 0;
  runtime.memoryNoticeSeen = saved.memoryNoticeSeen && typeof saved.memoryNoticeSeen === "object" ? saved.memoryNoticeSeen : runtime.memoryNoticeSeen;
  runtime.memoryNoticeOpen = providerSupportsMemoryNotice(runtime.selectedAi) && !runtime.memoryNoticeSeen[runtime.selectedAi];
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function announce(message) {
  document.getElementById("live-region").textContent = message;
}

const ERROR_DEFINITIONS = {
  invalid_cloud_session: ["error.session", "signin", "action.signin"],
  invalid_authorization: ["error.session", "signin", "action.signin"],
  verification_request_limited: ["error.rateVerification", "change-email", "action.changeEmail"],
  support_request_limited: ["error.supportLimit", "retry", "common.try"],
  match_not_found: ["error.matchMissing", "matches", "action.matches"],
  peer_profile_not_found: ["error.peerMissing", "matches", "action.matches"],
  match_expired: ["error.matchExpired", "matches", "action.matches"],
  invitation_decision_already_recorded: ["error.decisionRecorded", "matches", "action.matches"],
  invalid_invitation_decision: ["error.invitation", "matches", "action.matches"],
  publish_profile_before_matching: ["error.publishFirst", "create-pitch", "action.createPitch"],
  profile_not_found: ["error.profileMissing", "create-pitch", "action.createPitch"],
  profile_version_not_found: ["error.versionMissing", "create-pitch", "action.createPitch"],
  profile_publish_failed: ["error.publish", "retry", "common.try"],
  invalid_publish_payload: ["error.publishPayload", "retry", "common.try"],
  pairing_failed: ["error.pairing", "retry", "common.try"],
  matching_trigger_failed: ["error.matching", "retry", "common.try"],
  verification_request_failed: ["error.codeSend", "retry", "common.try"],
  verification_confirmation_failed: ["error.codeConfirm", "retry", "common.try"],
  invalid_or_expired_code: ["error.codeCombined", "change-email", "action.changeEmail"],
  invalid_code: ["error.invalidCode", "retry", "common.try"],
  challenge_id_required: ["error.challengeMissing", "change-email", "action.changeEmail"],
  email_delivery_disabled: ["error.emailDisabled", "retry", "common.try"],
  profile_access_failed: ["error.profileLoad", "retry", "common.try"],
  profile_draft_failed: ["error.draftLoad", "retry", "common.try"],
  matching_unavailable: ["error.matchingUnavailable", "retry", "common.try"],
};

function userFacingError(message, action = "retry", actionLabel = t("common.try"), options = {}) {
  const error = new Error(message);
  error.userFacing = true;
  error.action = action;
  error.actionLabel = actionLabel;
  Object.assign(error, options);
  return error;
}

function mapError(identifier, status, body = {}) {
  const normalized = String(identifier || "").trim();
  if (normalized === "verification_request_limited") {
    const waitSeconds = Math.max(1, Number(body.retryAfterSeconds) || 30);
    const waitText = waitSeconds >= 3600
      ? t("time.hour", { count: Math.ceil(waitSeconds / 3600) })
      : waitSeconds >= 60 ? t("time.minute", { count: Math.ceil(waitSeconds / 60) }) : t("time.second", { count: waitSeconds });
    return userFacingError(t("error.rateVerification", { wait: waitText }), "change-email", t("action.changeEmail"), { identifier: normalized, status, body });
  }
  const definition = ERROR_DEFINITIONS[normalized]
    || (status === 401 ? ERROR_DEFINITIONS.invalid_cloud_session : null)
    || (status === 429 ? ["error.rateGeneric", "retry", "common.try"] : null);
  if (definition) return userFacingError(t(definition[0]), definition[1], t(definition[2]), { identifier: normalized, status, body });
  console.error("Unmapped API error", { identifier: normalized || "unknown", status });
  return userFacingError(t("error.generic"), "retry", t("common.try"), { identifier: normalized, status, body });
}

function normalizeError(error) {
  if (error?.userFacing) return error;
  if (error instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(String(error?.message || ""))) {
    console.error("Network request failed", error);
    return userFacingError(t("error.offline"), "retry", t("common.try"), { identifier: "network_offline" });
  }
  if (error instanceof Error && error.message) return userFacingError(error.message, "dismiss", t("action.backForm"));
  console.error("Unknown application error", error);
  return userFacingError(t("error.generic"), "retry", t("common.try"));
}

function setRuntimeError(error) {
  const normalized = normalizeError(error);
  runtime.error = normalized;
  if (normalized.action === "signin") {
    if (runtime.draft) writeJson(DRAFT_KEY, runtime.draft);
    runtime.session = null;
    clearAuthFlow();
    writeJson(STORAGE_KEY, null);
    history.replaceState({}, "", "/signin");
  }
  return normalized;
}

function errorNotice() {
  if (!runtime.error) return "";
  const error = typeof runtime.error === "string" ? userFacingError(runtime.error) : runtime.error;
  return `<div class="notice error" role="alert" tabindex="-1"><div>${esc(error.message)}</div>${error.action ? `<button class="button quiet" style="margin-top:10px" data-action="error-${esc(error.action)}">${esc(error.actionLabel)}</button>` : ""}<a class="support-link" href="/support" data-link>${esc(t("support.help"))}</a></div>`;
}

function navigate(path, { replace = false } = {}) {
  const target = new URL(path, location.origin);
  if (target.pathname !== "/matches") stopMatchesPolling();
  if (target.pathname === "/matches" && `${target.pathname}${target.search}` !== `${location.pathname}${location.search}`) runtime.matches = null;
  if (path !== "/signin") {
    clearInterval(otpCountdownTimer);
    otpCountdownTimer = null;
  }
  history[replace ? "replaceState" : "pushState"]({}, "", `${target.pathname}${target.search}${target.hash}`);
  runtime.error = "";
  runtime.notice = "";
  runtime.match = null;
  runtime.pendingMatchDecision = null;
  window.scrollTo(0, 0);
  render();
}

function isRecentPublish() {
  return runtime.lastPublishAt > 0 && Date.now() - runtime.lastPublishAt < MATCH_SEARCH_WINDOW_MS;
}

function stopMatchesPolling() {
  clearTimeout(matchesPollTimer);
  clearInterval(matchesCountdownTimer);
  matchesPollTimer = null;
  matchesCountdownTimer = null;
  nextMatchCheckAt = 0;
}

function updateMatchCountdown() {
  const line = document.querySelector("[data-match-countdown]");
  if (!line) return;
  const seconds = Math.max(0, Math.ceil((nextMatchCheckAt - Date.now()) / 1000));
  line.textContent = t("matches.checking", { seconds });
}

function ensureMatchesPolling() {
  if (location.pathname !== "/matches" || document.hidden || !isRecentPublish() || runtime.matchesPollError || runtime.matches?.length) {
    stopMatchesPolling();
    return;
  }
  if (matchesPollTimer) return;
  nextMatchCheckAt = Date.now() + MATCH_POLL_INTERVAL_MS;
  updateMatchCountdown();
  matchesCountdownTimer = setInterval(updateMatchCountdown, 1000);
  matchesPollTimer = setTimeout(async () => {
    stopMatchesPolling();
    await loadMatches({ polling: true });
  }, MATCH_POLL_INTERVAL_MS);
}

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (runtime.session?.accessToken && !headers.authorization) headers.authorization = `Bearer ${runtime.session.accessToken}`;
  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch (error) {
    throw normalizeError(error);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw mapError(body.error, response.status, body);
  }
  return body;
}

function shell(content, { nav = false, active = "", action = "" } = {}) {
  const homeHref = runtime.session || runtime.demo ? (runtime.profile?.visibility === "private" ? "/pitch" : "/matches") : "/";
  return `<div class="app-shell"><section class="screen ${nav ? "" : "no-nav"}">
    <header class="wordmark"><a href="${homeHref}" data-link>PITCHYOUROWNER</a>${action}</header>
    ${errorNotice()}
    ${runtime.notice ? `<div class="notice success">${esc(runtime.notice)}</div>` : ""}
    ${content}
  </section>${nav ? bottomNav(active) : ""}</div>`;
}

function progressHeader(step, labelKey) {
  return `<p class="eyebrow">${esc(t(labelKey))}</p>
    <div class="progress" aria-label="${esc(t("progress.aria", { step }))}">${[1, 2, 3].map((segment) => `<span class="${segment <= step ? "active" : ""}"></span>`).join("")}</div>`;
}

function onboardingExit() {
  return runtime.profile ? `<a href="${runtime.profile.visibility === "private" ? "/pitch" : "/matches"}" data-link class="flow-exit">${esc(runtime.profile.visibility === "private" ? t("nav.pitch") : t("flow.leaveMatches"))}</a>` : "";
}

function flowNavigation(backPath, backLabelKey) {
  return `<div class="flow-navigation"><a href="${backPath}" data-link class="flow-back">← ${esc(t(backLabelKey))}</a>${onboardingExit()}</div>`;
}

function focusErrorNotice() {
  requestAnimationFrame(() => {
    const notice = document.querySelector('[role="alert"]');
    notice?.focus({ preventScroll: true });
    notice?.scrollIntoView({ block: "start" });
  });
}

function bottomNav(active) {
  const links = [["matches", "/matches", "nav.matches"], ["invitations", "/invitations", "nav.invites"], ["pitch", "/pitch", "nav.pitch"], ["settings", "/settings", "nav.settings"]];
  return `<nav class="bottom-nav" aria-label="${esc(t("nav.label"))}">${links.map(([key, href, label]) => `<a href="${href}" data-link class="${active === key ? "active" : ""}" ${active === key ? 'aria-current="page"' : ""}>${esc(t(label))}</a>`).join("")}</nav>`;
}

function handoffButtonLabel() {
  if (runtime.selectedAi === "ChatGPT") return t("handoff.openChatgpt");
  if (runtime.selectedAi === "Claude") return t("handoff.openClaude");
  return t("handoff.share");
}

function providerSupportsMemoryNotice(ai = runtime.selectedAi) {
  return ai === "ChatGPT" || ai === "Claude";
}

function providerLaunchUrl(prompt = runtime.prompt, ai = runtime.selectedAi) {
  if (!providerSupportsMemoryNotice(ai)) return "";
  const target = new URL(ai === "Claude" ? "https://claude.ai/new" : "https://chatgpt.com/");
  target.searchParams.set("q", String(prompt || ""));
  return target.toString();
}

async function openProviderWithPrompt(prompt, ai) {
  window.open(providerLaunchUrl(prompt, ai), "_blank", "noopener,noreferrer");
  return copyPromptBestEffort(prompt);
}

function memoryNoticeMedia() {
  if (!providerSupportsMemoryNotice()) return "";
  const basename = runtime.selectedAi === "Claude" ? "claude-enable-memory" : "chatgpt-enable-memory";
  const alt = esc(t("memory.videoAlt", { ai: runtime.selectedAi }));
  return `<picture>
    <source media="(prefers-reduced-motion: reduce)" srcset="/assets/memory/${basename}.png">
    <img src="/assets/memory/${basename}.gif" alt="${alt}" width="600" loading="eager" decoding="async">
  </picture>`;
}

function memoryNoticeModal() {
  if (!runtime.memoryNoticeOpen || !providerSupportsMemoryNotice()) return "";
  return `<div class="memory-modal-backdrop" data-memory-modal>
    <section class="memory-modal" role="dialog" aria-modal="true" aria-labelledby="memory-modal-title" aria-describedby="memory-modal-description" tabindex="-1">
      <button class="memory-modal-close" data-action="dismiss-memory-notice" aria-label="${esc(t("memory.close"))}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      <p class="eyebrow">${esc(runtime.selectedAi)} · MEMORY</p>
      <h2 id="memory-modal-title">${esc(t("memory.title", { ai: runtime.selectedAi }))}</h2>
      <p id="memory-modal-description">${esc(t("memory.body", { ai: runtime.selectedAi }))}</p>
      <div class="memory-modal-media">${memoryNoticeMedia()}</div>
      <p class="memory-modal-limit">${esc(t("memory.limit"))}</p>
      <div class="button-stack">
        <button class="button primary" data-action="confirm-memory-notice">${esc(t("memory.confirm"))}</button>
        <button class="button quiet" data-action="dismiss-memory-notice">${esc(t("memory.later"))}</button>
      </div>
    </section>
  </div>`;
}

function syncMemoryNoticeUi() {
  const dialog = document.querySelector(".memory-modal[role=dialog]");
  const isOpen = Boolean(dialog && runtime.memoryNoticeOpen && location.pathname.replace(/\/$/, "") === "/handoff");
  const shell = document.querySelector(".app-shell");
  if (shell) {
    shell.toggleAttribute("inert", isOpen);
    shell.setAttribute("aria-hidden", isOpen ? "true" : "false");
  }
  document.body.classList.toggle("modal-open", isOpen);
  if (isOpen) queueMicrotask(() => dialog.focus({ preventScroll: true }));
}

function openMemoryNotice(returnAction = "open-memory-notice") {
  if (!providerSupportsMemoryNotice()) return;
  runtime.memoryNoticeReturnAction = returnAction;
  runtime.memoryNoticeOpen = true;
  render();
}

function closeMemoryNotice() {
  const returnAction = runtime.memoryNoticeReturnAction || "launch-ai-with-prompt";
  runtime.memoryNoticeSeen = { ...runtime.memoryNoticeSeen, [runtime.selectedAi]: true };
  runtime.memoryNoticeOpen = false;
  saveHandoff();
  render();
  requestAnimationFrame(() => document.querySelector(`[data-action="${returnAction}"]`)?.focus({ preventScroll: true }));
}

const JSON_GUIDE_STEPS = [
  ["guide.1.title", "guide.1.body"],
  ["guide.2.title", "guide.2.body"],
  ["guide.3.title", "guide.3.body"],
];

function jsonGuide(includeRecoveryStep = false) {
  const steps = includeRecoveryStep
    ? [...JSON_GUIDE_STEPS, ["guide.4.title", "guide.4.body"]]
    : JSON_GUIDE_STEPS;
  return `<ol class="json-guide">${steps.map(([title, detail]) => `<li><strong>${esc(t(title))}</strong><span>${esc(t(detail))}</span></li>`).join("")}</ol>`;
}

function promptFileForLocale() {
  return "/owner-pitch-prompt-zh-Hant.txt";
}

async function copyPromptBestEffort(prompt) {
  if (!navigator.clipboard?.writeText) return false;
  let timeoutId;
  try {
    return await Promise.race([
      navigator.clipboard.writeText(prompt).then(() => true, () => false),
      new Promise((resolve) => { timeoutId = setTimeout(() => resolve(false), 900); }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function launchAiWithPrompt() {
  const prompt = String(runtime.prompt || "").trim();
  if (!prompt) throw new Error(t("notice.promptMissing"));
  runtime.handoffLaunchedAt = Date.now();
  runtime.showFullPrompt = false;
  saveHandoff();

  if (runtime.selectedAi === "Other AI") {
    if (navigator.share) {
      await navigator.share({ title: t("handoff.shareTitle"), text: prompt });
      render();
      return;
    }
    const copied = await copyPromptBestEffort(prompt);
    if (!copied) throw new Error(t("notice.clipboardUnavailable"));
    runtime.notice = t("notice.shareCopied");
    announce(runtime.notice);
    render();
    return;
  }

  const copied = await openProviderWithPrompt(prompt, runtime.selectedAi);
  runtime.notice = t(copied ? "handoff.openedCopied" : "handoff.openedManual", { ai: runtime.selectedAi });
  announce(runtime.notice);
  render();
  window.scrollTo(0, 0);
}

async function launchConnectionEmailPrompt(ai) {
  if (!providerSupportsMemoryNotice(ai)) return;
  const prompt = String(runtime.connection?.first_email_prompt || "").trim();
  if (!prompt) throw new Error(t("notice.promptMissing"));
  const copied = await openProviderWithPrompt(prompt, ai);
  runtime.connectionPromptFallback = !copied;
  runtime.notice = t(copied ? "connection.promptOpened" : "connection.promptManual", { ai });
  announce(runtime.notice);
  render();
  window.scrollTo(0, 0);
}

async function copyPrompt() {
  const prompt = String(runtime.prompt || "").trim();
  if (!prompt) throw new Error(t("notice.promptMissing"));
  const copied = await copyPromptBestEffort(prompt);
  runtime.handoffLaunchedAt = Date.now();
  runtime.showFullPrompt = !copied;
  saveHandoff();
  runtime.notice = t(copied ? "handoff.promptCopied" : "notice.copyUnavailable");
  announce(runtime.notice);
  render();
  window.scrollTo(0, 0);
}

async function createPrompt() {
  const response = await fetch(promptFileForLocale(), { cache: "no-store" });
  if (!response.ok) throw userFacingError(t("error.prompt"), "retry", t("common.try"));
  runtime.prompt = await response.text();
  runtime.handoffLaunchedAt = 0;
  runtime.memoryNoticeOpen = providerSupportsMemoryNotice() && !runtime.memoryNoticeSeen[runtime.selectedAi];
  runtime.memoryNoticeReturnAction = "launch-ai-with-prompt";
  runtime.showFullPrompt = false;
  saveHandoff();
  navigate("/handoff");
}

async function retryCurrentScreen() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  const errorIdentifier = runtime.error?.identifier;
  runtime.error = "";
  if (path === "/matches") { runtime.matchesPollError = false; runtime.matches = null; render(); return; }
  if (/^\/matches\/[^/]+$/.test(path)) { runtime.match = null; render(); return; }
  if (path === "/invitations") { runtime.invitations = null; render(); return; }
  if (path === "/pitch") { runtime.profileLoaded = false; render(); return; }
  if (path === "/assistant") { await createPrompt(); return; }
  if (path === "/import" && runtime.draft && errorIdentifier === "profile_publish_failed") { await publishProfile(); return; }
  if (path === "/review" && runtime.draft) { navigate("/import", { replace: true }); return; }
  render();
}

function resendSecondsRemaining() {
  return Math.max(0, Math.ceil((runtime.resendAt - Date.now()) / 1000));
}

function updateOtpCountdown() {
  const remaining = resendSecondsRemaining();
  const status = document.querySelector("[data-resend-countdown]");
  const button = document.querySelector('[data-action="resend-code"]');
  if (status) status.textContent = remaining ? t("signin.resendIn", { seconds: remaining }) : t("signin.resendNow");
  if (button) button.disabled = runtime.busy || remaining > 0;
  if (!remaining) {
    clearInterval(otpCountdownTimer);
    otpCountdownTimer = null;
  }
}

function ensureOtpCountdown() {
  if (location.pathname !== "/signin" || !runtime.challengeId) {
    clearInterval(otpCountdownTimer);
    otpCountdownTimer = null;
    return;
  }
  updateOtpCountdown();
  if (resendSecondsRemaining() && !otpCountdownTimer) otpCountdownTimer = setInterval(updateOtpCountdown, 1000);
}

async function requestVerificationCode({ resend = false } = {}) {
  try {
    const result = await api("/v1/email-verifications", { method: "POST", body: JSON.stringify({ email: runtime.signinEmail }) });
    const now = Date.now();
    runtime.challengeId = result.challengeId;
    runtime.challengeExpiresAt = now + Math.max(1, Number(result.expiresInSeconds) || 600) * 1000;
    runtime.resendAt = now + 30 * 1000;
    runtime.verificationCode = "";
    runtime.codeError = "";
    saveAuthFlow();
    runtime.notice = resend ? t("signin.resent") : t("signin.sent");
    announce(runtime.notice);
  } catch (error) {
    if (error?.identifier === "verification_request_limited") {
      runtime.resendAt = Date.now() + Math.max(1, Number(error.body?.retryAfterSeconds) || 30) * 1000;
      saveAuthFlow();
    }
    throw error;
  }
}

async function resendVerificationCode({ ignoreCountdown = false } = {}) {
  if ((!ignoreCountdown && resendSecondsRemaining() > 0) || runtime.busy) return;
  runtime.busy = true;
  runtime.error = "";
  runtime.notice = "";
  render();
  try {
    await requestVerificationCode({ resend: true });
  } finally {
    runtime.busy = false;
    render();
  }
}

function startScreen() {
  return shell(`<div class="hero">
    <h1>${t("start.title")}</h1>
    <p class="promise">${esc(t("start.promise"))}</p>
  </div>
  <div class="checkpoint" aria-label="${esc(t("start.checkpoints"))}">
    <div><strong>1</strong><span>${esc(t("start.check1"))}</span></div>
    <div><strong>2</strong><span>${esc(t("start.check2"))}</span></div>
  </div>
  <p class="animal-showcase">${esc(t("landing.animals"))}</p>
  <p class="subtle" style="text-align:center">${esc(t("landing.flow"))}</p>
  <button class="button primary" data-action="begin">${esc(t("start.begin"))}</button>
  ${DEMO_AVAILABLE ? `<button class="button quiet" style="margin-top:9px" data-action="demo-flow">${esc(t("start.demo"))}</button>` : ""}
  <p class="subtle" style="text-align:center;margin:10px 0 0">${esc(t("start.duration"))}</p>`);
}

function signinScreen() {
  const codeStep = Boolean(runtime.challengeId);
  if (codeStep) queueMicrotask(ensureOtpCountdown);
  const remaining = resendSecondsRemaining();
  return shell(`<div>
    <p class="eyebrow">${esc(t(codeStep ? "signin.step2" : "signin.step1"))}</p>
    <h1 class="page-title">${esc(t(codeStep ? "signin.verifyTitle" : "signin.title"))}</h1>
    <p class="page-intro">${codeStep ? `${esc(t("signin.sentTo"))}<br><strong style="color:var(--ink);overflow-wrap:anywhere">${esc(runtime.signinEmail)}</strong>` : esc(t("signin.intro"))}</p>
    <form class="form" data-form="${codeStep ? "confirm-code" : "request-code"}" ${codeStep ? "novalidate" : ""}>
      ${codeStep ? `<label class="field"><span class="field-label">${esc(t("signin.code"))}</span><input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required value="${esc(runtime.verificationCode)}" aria-describedby="code-error" ${runtime.codeError ? 'aria-invalid="true"' : ""}><span class="field-hint" id="code-error" ${runtime.codeError ? 'role="alert"' : ""}>${esc(runtime.codeError)}</span></label>` : `<label class="field"><span class="field-label">${esc(t("signin.email"))}</span><input name="email" type="email" inputmode="email" autocomplete="email" required placeholder="owner@example.com" value="${esc(runtime.signinEmail)}"></label>`}
      <button class="button primary" ${runtime.busy ? "disabled" : ""}>${esc(runtime.busy ? t("common.loading") : t(codeStep ? "signin.verify" : "signin.send"))}</button>
    </form>
    ${codeStep ? `<button class="button quiet" style="margin-top:9px;width:100%" data-action="resend-code" ${runtime.busy || remaining ? "disabled" : ""}>${esc(t("signin.resend"))}</button><p class="subtle" style="text-align:center;margin:7px 0 0" data-resend-countdown aria-live="polite">${esc(remaining ? t("signin.resendIn", { seconds: remaining }) : t("signin.resendNow"))}</p><button class="button quiet" style="margin-top:9px;width:100%" data-action="change-email">${esc(t("signin.change"))}</button>` : ""}
  </div>`);
}

function assistantScreen() {
  const aiOptions = [["ChatGPT", "ChatGPT"], ["Claude", "Claude"], ["Other AI", t("assistant.other")]];
  return shell(`${progressHeader(1, "assistant.step")}
    <h1 class="page-title">${esc(t("assistant.title"))}</h1>
    <p class="page-intro">${esc(t("assistant.intro"))}</p>
    <div class="assistant-grid">${aiOptions.map(([value, label]) => `<button class="assistant-card" data-action="select-ai" data-ai="${value}" aria-pressed="${runtime.selectedAi === value}"><strong>${esc(label)}</strong><span>${esc(t(runtime.selectedAi === value ? "assistant.selected" : "assistant.choose"))}</span></button>`).join("")}</div>
    <div style="margin-top:auto;padding-top:28px"><button class="button primary" style="width:100%" data-action="create-prompt">${esc(t("assistant.create"))}</button>${onboardingExit()}</div>`, { action: `<a href="/settings" data-link class="text-action">${esc(t("account"))}</a>` });
}

function handoffScreen() {
  const promptReady = Boolean(String(runtime.prompt || "").trim());
  const afterHandoff = runtime.handoffLaunchedAt > 0;
  const fallbackUrl = afterHandoff ? providerLaunchUrl() : "";
  const prompt = `<div class="prompt-box" aria-label="${esc(t("prompt.aria"))}">${esc(runtime.prompt || t("handoff.loading"))}</div>`;
  const actions = afterHandoff
    ? `<p class="page-intro">${esc(t("handoff.return", { ai: runtime.selectedAi }))}</p>
      <button class="button primary" style="width:100%" data-action="go-import">${esc(t("handoff.paste"))}</button>
      <button class="button quiet" style="margin-top:9px;width:100%" data-action="launch-ai-with-prompt" ${promptReady ? "" : "disabled"}>${esc(t("handoff.openAgain", { ai: runtime.selectedAi }))}</button>
      ${fallbackUrl ? `<a class="handoff-provider-fallback" href="${esc(fallbackUrl)}" target="_blank" rel="noopener noreferrer">${esc(t("handoff.openFallback", { ai: runtime.selectedAi }))}</a>` : ""}
      <button class="text-action handoff-text-action" data-action="copy-prompt" ${promptReady ? "" : "disabled"}>${esc(t("handoff.copyAgain"))}</button>`
    : `${prompt}
      <p class="subtle">${esc(t("handoff.explainer"))}</p>
      ${jsonGuide()}
      <button class="button primary" style="width:100%" data-action="launch-ai-with-prompt" ${promptReady ? "" : "disabled"}>${esc(handoffButtonLabel())}</button>
      <p class="subtle" style="text-align:center;margin:9px 0 0">${esc(t("handoff.launchHelp", { ai: runtime.selectedAi }))}</p>
      <button class="button quiet" style="margin-top:9px;width:100%" data-action="copy-prompt" ${promptReady ? "" : "disabled"}>${esc(t("handoff.copy"))}</button>`;
  const collapsedPrompt = afterHandoff
    ? `<div class="settings-row"><span>${esc(t("handoff.ready"))}</span><button data-action="toggle-full-prompt">${esc(t(runtime.showFullPrompt ? "handoff.hide" : "handoff.show"))}</button></div>${runtime.showFullPrompt ? prompt : ""}`
    : "";
  return shell(`${flowNavigation("/assistant", "flow.backToAi")}
    ${progressHeader(2, "handoff.step")}
    <div class="prompt-meta"><span>${esc(runtime.selectedAi)}</span><span>${esc(t("language.current"))}</span></div>
    <h1 class="page-title">${esc(afterHandoff ? t("handoff.afterTitle") : t("handoff.beforeTitle", { ai: runtime.selectedAi }))}</h1>
    ${providerSupportsMemoryNotice() ? `<button class="memory-reopen" data-action="open-memory-notice">${esc(t("memory.reopen", { ai: runtime.selectedAi }))}</button>` : ""}
    ${!promptReady ? `<div class="notice error">${esc(t("handoff.loadError"))}</div>` : ""}
    ${collapsedPrompt}
    ${actions}`) + memoryNoticeModal();
}

function normalizeJsonInput(value) {
  let source = String(value ?? "").replace(/^\uFEFF/, "").replace(/^\u00a0+|\u00a0+$/g, "").trim();
  const fence = source.match(/^```(?:json)?[\t ]*\r?\n([\s\S]*?)\r?\n```$/i);
  if (fence) source = fence[1].trim();
  let output = "";
  let quote = null;
  let escaped = false;
  let smartQuotes = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (!quote && (character === "“" || character === "”")) {
      quote = "smart"; smartQuotes = true; output += '"'; continue;
    }
    if (!quote && character === '"') { quote = "ascii"; output += character; continue; }
    if (quote === "smart" && character === "”" && !escaped) { quote = null; output += '"'; continue; }
    if (quote === "smart" && character === '"' && !escaped) { output += '\\"'; continue; }
    if (quote === "ascii" && character === '"' && !escaped) { quote = null; output += character; continue; }
    output += character;
    escaped = Boolean(quote && character === "\\" && !escaped);
    if (character !== "\\") escaped = false;
  }
  return { source: output, smartQuotes };
}

function duplicateJsonKey(source) {
  const scopes = [];
  let quote = false; let escaped = false; let start = -1;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === '"' && !escaped) {
        quote = false;
        let next = index + 1;
        while (/\s/.test(source[next] || "")) next += 1;
        const scope = scopes[scopes.length - 1];
        if (source[next] === ":" && scope instanceof Set) {
          let key;
          try { key = JSON.parse(source.slice(start, index + 1)); } catch { key = source.slice(start + 1, index); }
          if (scope.has(key)) return key;
          scope.add(key);
        }
      }
      escaped = character === "\\" ? !escaped : false;
      continue;
    }
    if (character === '"') { quote = true; escaped = false; start = index; }
    else if (character === "{") scopes.push(new Set());
    else if (character === "[") scopes.push(null);
    else if (character === "}" || character === "]") scopes.pop();
  }
  return null;
}

function parseJsonCandidate(value) {
  const normalized = ProfileJson.normalizeJsonInput(value);
  const duplicate = ProfileJson.duplicateJsonKey(normalized.source);
  if (duplicate) throw new Error(t("validation.duplicateKey", { key: duplicate }));
  let parsed;
  try {
    parsed = JSON.parse(normalized.source);
  } catch (error) {
    const detail = String(error?.message || "格式不完整").replace(/^JSON\.parse:\s*/i, "");
    throw new Error(t(normalized.smartQuotes ? "validation.smartQuotes" : "validation.syntax", { detail }));
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(t("validation.json"));
  if (Object.hasOwn(parsed, "profile")) {
    if (Object.keys(parsed).length !== 1) throw new Error(t("validation.unknown"));
    parsed = parsed.profile;
  }
  return parsed;
}

function validateProfileClient(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) throw new Error(t("validation.json"));
  const allowed = new Set([...FIELD_ORDER, "confidence"]);
  const unknown = Object.keys(profile).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(t("validation.unknown"));
  for (const field of FIELD_ORDER) {
    const config = PROFILE_SCHEMA_CONFIG?.core_fields?.[field];
    const label = fieldLabel(field);
    if (ARRAY_FIELDS.includes(field)) {
      if (!Array.isArray(profile[field]) || profile[field].some((item) => typeof item !== "string" || !item.trim())) throw new Error(t("validation.array", { label }));
      if (config?.max_items && profile[field].length > config.max_items) throw new Error(t("validation.maxItems", { label, count: config.max_items }));
      if (config?.item_max_length && profile[field].some((item) => item.trim().length > config.item_max_length)) throw new Error(t("validation.itemLong", { label }));
      const folded = profile[field].map((item) => item.trim().toLocaleLowerCase());
      if (new Set(folded).size !== folded.length) throw new Error(t("validation.duplicateItem", { label }));
    } else if (typeof profile[field] !== "string" || !profile[field].trim()) throw new Error(t("validation.required", { label }));
    else if (config?.max_length && profile[field].trim().length > config.max_length) throw new Error(t("validation.maxLength", { label, count: config.max_length }));
  }
  if (!profile.confidence || typeof profile.confidence !== "object") throw new Error(t("validation.confidenceMissing"));
  const unknownConfidence = Object.keys(profile.confidence).filter((field) => !CONFIDENCE_FIELDS.includes(field));
  if (unknownConfidence.length) throw new Error(t("validation.unknown"));
  for (const field of CONFIDENCE_FIELDS) if (!CONFIDENCE_LEVELS.includes(profile.confidence[field])) throw new Error(t("validation.confidence", { label: fieldLabel(field), levels: CONFIDENCE_LEVELS.map(confidenceLabel).join(runtime.locale === "zh-Hant" ? "、" : ", ") }));
  return profile;
}

function importScreen() {
  const editingPublished = runtime.draftMode === "edit-published";
  if (!runtime.draft || runtime.importMode === "paste") {
    return shell(`${flowNavigation("/handoff", "flow.backToHandoff")}
      ${progressHeader(3, "import.stepPaste")}
      <h1 class="page-title">${esc(t("import.title"))}</h1>
      <p class="page-intro">${esc(t("import.intro"))}</p>
      ${jsonGuide(true)}
      <form class="form" data-form="parse-json">
        <label class="field"><span class="field-label">${esc(t("import.jsonLabel"))}</span><textarea class="tall" name="json" required placeholder="${esc(t("json.placeholder"))}">${esc(runtime.importJson)}</textarea></label>
        <button class="button primary">${esc(t("import.render"))}</button>
      </form>
      ${DEMO_AVAILABLE && runtime.demo && !runtime.session ? `<button class="button quiet" style="margin-top:9px" data-action="load-sample">${esc(t("import.demo"))}</button><p class="subtle" style="margin:7px 0 0">${esc(t("import.demoCaption"))}</p>` : ""}`);
  }
  return shell(`${editingPublished ? `<div class="flow-navigation"><button class="flow-back" data-action="cancel-pitch-edit">← ${esc(t("flow.cancelEdit"))}</button></div><p class="eyebrow">${esc(t("import.editingEyebrow"))}</p>` : `${flowNavigation("/handoff", "flow.backToHandoff")}${progressHeader(3, "import.stepEdit")}`}
    <h1 class="page-title">${esc(t("import.editTitle"))}</h1>
    <p class="page-intro">${esc(t("import.editIntro"))}</p>
    <form data-form="publish-profile" novalidate>
      ${editableProfileDocument(runtime.draft)}
      <div class="button-row"><button type="button" class="button" data-action="${editingPublished ? "cancel-pitch-edit" : "replace-json"}">${esc(t(editingPublished ? "flow.cancelEdit" : "import.pasteAgain"))}</button><button type="button" class="button primary" data-action="confirm-publish" ${runtime.busy ? "disabled" : ""}>${esc(t(runtime.busy ? "review.publishing" : editingPublished ? "review.publishChanges" : "import.continue"))}</button></div>
    </form>`);
}

function confidenceControl(profile, field) {
  return `<select class="confidence-control" name="confidence.${field}" aria-label="${esc(`${fieldLabel(field)} ${t("field.confidence")}`)}">${CONFIDENCE_LEVELS.map((level) => `<option value="${level}" ${profile.confidence[field] === level ? "selected" : ""}>${esc(confidenceLabel(level))}</option>`).join("")}</select>`;
}

function textLimit(field, item = false) {
  const config = PROFILE_SCHEMA_CONFIG?.core_fields?.[field];
  const limit = item ? config?.item_max_length : config?.max_length;
  return limit ? ` maxlength="${Number(limit)}"` : "";
}

function removeItemIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="currentColor"></circle><path d="M7.5 12h9" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"></path></svg>`;
}

function editableArrayField(profile, field) {
  const label = fieldLabel(field);
  const items = profile[field].map((item, index) => `<span class="editable-tag"><textarea class="tag-editor" name="${field}" rows="1" data-draft-field="${field}" data-index="${index}" aria-label="${esc(`${label} ${index + 1}`)}"${textLimit(field, true)}>${esc(item)}</textarea><button class="remove-item" type="button" data-action="remove-profile-item" data-field="${field}" data-index="${index}" aria-label="${esc(t("import.removeItem", { label }))}">${removeItemIcon()}</button></span>`).join("");
  return `<section class="doc-field"><div class="doc-field-head"><span class="field-label">${esc(label)}</span>${confidenceControl(profile, field)}</div><div class="tag-list">${items}</div><button class="add-item" type="button" data-action="add-profile-item" data-field="${field}">＋ ${esc(t("import.addItem"))}</button></section>`;
}

function editableProfileDocument(profile) {
  const textarea = (field, className, rows) => `<textarea class="document-editor ${className}" name="${field}" rows="${rows}" data-draft-field="${field}" aria-label="${esc(fieldLabel(field))}"${textLimit(field)}>${esc(profile[field])}</textarea>`;
  return `<div class="document editable-document">
    <input type="hidden" name="history_scope" value="${esc(profile.history_scope)}">
    ${textarea("animal_persona", "animal-persona-editor", 1)}
    <div class="summary-editor-head"><span class="field-label">${esc(fieldLabel("summary"))}</span>${confidenceControl(profile, "summary")}</div>
    ${textarea("summary", "summary-editor", 4)}
    ${["interests", "motivations", "active_problems", "recurring_topics"].map((field) => editableArrayField(profile, field)).join("")}
    <section class="doc-field"><div class="doc-field-head"><span class="field-label">${esc(fieldLabel("friend_intent"))}</span>${confidenceControl(profile, "friend_intent")}</div>${textarea("friend_intent", "friend-intent-editor", 3)}</section>
    <div class="provenance"><span>${esc(t("profile.conversation"))}</span><span>${esc(t("profile.approved"))}</span><span>${esc(t("profile.exploring"))}</span></div>
  </div>`;
}

function profileFromForm(form) {
  const data = new FormData(form);
  const profile = { confidence: {} };
  for (const field of FIELD_ORDER) {
    profile[field] = ARRAY_FIELDS.includes(field)
      ? data.getAll(field).map((item) => String(item).trim()).filter(Boolean)
      : String(data.get(field) || "").trim();
  }
  for (const field of CONFIDENCE_FIELDS) profile.confidence[field] = String(data.get(`confidence.${field}`) || "low");
  return validateProfileClient(profile);
}

function fitDocumentEditor(control) {
  if (!control?.matches?.("textarea.document-editor, textarea.tag-editor")) return;
  control.style.height = "auto";
  control.style.height = `${Math.max(control.classList.contains("tag-editor") ? 24 : 42, control.scrollHeight)}px`;
}

function fitDocumentEditors() {
  document.querySelectorAll("textarea.document-editor, textarea.tag-editor").forEach(fitDocumentEditor);
}

function profileDocument(profile, showConfidence) {
  const listOrText = (field) => ARRAY_FIELDS.includes(field)
    ? `<div class="tag-list">${profile[field].map((item) => `<span class="tag">${esc(item)}</span>`).join("")}</div>`
    : `<p>${esc(profile[field])}</p>`;
  return `<div class="document">
    <p class="animal-persona">${esc(profile.animal_persona || "帶著好奇心探索的水獺")}</p>
    <p class="doc-summary">${esc(profile.summary)}</p>
    ${["interests", "motivations", "active_problems", "recurring_topics", "friend_intent"].map((field) => `<section class="doc-field"><div class="doc-field-head"><span class="field-label">${esc(fieldLabel(field))}</span>${showConfidence ? `<span class="confidence">${esc(confidenceLabel(profile.confidence[field]))}</span>` : ""}</div>${listOrText(field)}</section>`).join("")}
    <div class="provenance"><span>${esc(t("profile.conversation"))}</span><span>${esc(t("profile.approved"))}</span><span>${esc(t("profile.exploring"))}</span></div>
  </div>`;
}

function publicProfileDocument(profile) {
  if (!profile) return "";
  const list = (field) => Array.isArray(profile[field]) && profile[field].length ? `<section class="doc-field"><span class="field-label">${esc(fieldLabel(field))}</span><div class="tag-list">${profile[field].map((item) => `<span class="tag">${esc(item)}</span>`).join("")}</div></section>` : "";
  return `<div class="document"><p class="animal-persona">${esc(profile.animal_persona || genericAnimal)}</p><p class="doc-summary">${esc(profile.summary || "")}</p>${["interests", "motivations", "active_problems", "recurring_topics"].map(list).join("")}<section class="doc-field"><span class="field-label">${esc(fieldLabel("friend_intent"))}</span><p>${esc(profile.friend_intent || "")}</p></section></div>`;
}

function acceptScreen() {
  if (runtime.invitationDecision) return shell(`<div class="hero"><h1>${esc(t("accept.done"))}</h1><p class="promise">${esc(runtime.invitationDecision === "connected" ? "你們都接受了。登入後可在邀請頁查看聯絡方式。" : "已選擇現在不要；對方不會看到拒絕理由。")}</p></div><a class="button primary" href="${runtime.session ? "/invitations" : "/signin"}" data-link>${esc(runtime.session ? "前往邀請" : "登入 PitchYourOwner")}</a>`);
  if (!runtime.invitationPreview) {
    loadInvitationPreview();
    return shell(`<div class="loading">${esc(t("accept.loading"))}</div>`);
  }
  const preview = runtime.invitationPreview;
  const inviter = preview.inviter || {};
  return shell(`<p class="eyebrow">PitchYourOwner 邀請</p><h1 class="page-title">${esc(t("accept.title"))}</h1><p class="page-intro">${esc(peerPresentationName(inviter))} 的 Agent 覺得你們現在值得聊聊。</p>${publicProfileDocument(inviter.profile)}<div class="question-card"><section class="question"><div class="step-label">為什麼值得聊</div><h2>${esc(preview.explanation?.whatWeBothCareAbout || "你們有一個具體的共同關注。")}</h2><p>${esc(preview.explanation?.whatWeCouldDiscuss || "可以從最近正在嘗試的方法開始交換。")}</p></section></div><p class="subtle">${esc(t("accept.note"))}</p><div class="button-row"><button class="button" data-action="respond-token" data-decision="not_now">${esc(t("accept.notNow"))}</button><button class="button primary" data-action="respond-token" data-decision="accept">${esc(t("accept.accept"))}</button></div>`);
}

async function loadInvitationPreview() {
  try {
    const token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
    if (!token) throw new Error("邀請連結不完整或已失效。");
    runtime.invitationPreview = await api("/v1/invitation-tokens/preview", { method: "POST", body: JSON.stringify({ token }) });
  } catch (error) { setRuntimeError(error); runtime.invitationPreview = { inviter: {}, explanation: {} }; }
  render();
}

async function respondInvitation(decision) {
  const token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
  const result = await api("/v1/invitation-tokens/respond", { method: "POST", body: JSON.stringify({ token, decision }) });
  runtime.invitationDecision = result.state;
  history.replaceState({}, "", "/accept");
  render();
}

function connectionScreen(connectionId) {
  if (!runtime.connection || runtime.connection.connection_id !== connectionId) {
    loadConnection(connectionId);
    return shell(`<div class="loading">正在載入聯絡方式</div>`, { nav: true, active: "invitations" });
  }
  const peer = runtime.connection.peer || {};
  const manualPrompt = runtime.connectionPromptFallback ? `<section class="connection-prompt-fallback"><label class="field"><span class="field-label">${esc(t("connection.promptFallbackTitle"))}</span><span class="field-hint">${esc(t("connection.promptFallbackBody"))}</span><textarea class="prompt-box" readonly rows="12">${esc(runtime.connection.first_email_prompt)}</textarea></label></section>` : "";
  return shell(`<a href="/invitations" data-link class="eyebrow" style="text-decoration:none">← 返回邀請</a><h1 class="page-title">${esc(t("connection.title"))}</h1><p class="page-intro">你和 ${esc(peerPresentationName(peer))} 都明確接受了這次介紹。</p>${publicProfileDocument(peer.profile)}<div class="notice success"><span class="field-label">${esc(t("connection.email"))}</span><p><a href="mailto:${esc(peer.contact_email)}">${esc(peer.contact_email)}</a></p></div><section class="connection-ai"><p class="eyebrow">${esc(t("connection.aiEyebrow"))}</p><h2>${esc(t("connection.aiTitle"))}</h2><p>${esc(t("connection.aiBody"))}</p><div class="button-stack"><button class="button primary" data-action="write-connection-email" data-ai="ChatGPT">${esc(t("connection.chatgpt"))}</button><button class="button" data-action="write-connection-email" data-ai="Claude">${esc(t("connection.claude"))}</button></div></section>${manualPrompt}`, { nav: true, active: "invitations" });
}

async function loadConnection(connectionId) {
  runtime.connectionPromptFallback = false;
  if (runtime.demo && connectionId === DEMO_CONNECTION_ID) {
    const match = structuredClone(runtime.demoMatch);
    runtime.connection = {
      connection_id: DEMO_CONNECTION_ID,
      self: { profile: sampleProfile() },
      peer: match.peer,
      explanation: match.explanation,
      first_email_prompt: demoFirstEmailPrompt(),
    };
    queueMicrotask(render);
    return;
  }
  try { runtime.connection = await api(`/v1/connections/${encodeURIComponent(connectionId)}`); }
  catch (error) { setRuntimeError(error); }
  render();
}

function evidenceLabel(field) {
  return FIELD_META[field] ? fieldLabel(field) : String(field || "").replace(/_/g, " ");
}

function pitchScreen() {
  if (!runtime.profileLoaded) {
    loadProfile();
    return shell(`<div class="loading">${esc(t("pitch.loading"))}</div>`, { nav: true, active: "pitch", action: `<button class="text-action" disabled>${esc(t("pitch.edit"))}</button>` });
  }
  if (!runtime.profile) return shell(`<div class="empty"><p class="eyebrow">${esc(t("pitch.emptyEyebrow"))}</p><h2>${esc(t("pitch.emptyTitle"))}</h2><p>${esc(t("pitch.emptyBody"))}</p><a class="button primary" href="/assistant" data-link>${esc(t("pitch.create"))}</a></div>`, { nav: true, active: "pitch" });
  const draftChoice = runtime.pendingPitchEdit ? `<div class="draft-choice" role="dialog" aria-labelledby="draft-choice-title" tabindex="-1">
    <strong id="draft-choice-title">${esc(t("pitch.draftChoiceTitle"))}</strong>
    <p>${esc(t("pitch.draftChoiceBody"))}</p>
    <div class="button-stack"><button class="button primary" data-action="resume-pitch-draft">${esc(t("pitch.resumeDraft"))}</button><button class="button" data-action="confirm-edit-published">${esc(t("pitch.editPublished"))}</button><button class="button quiet" data-action="cancel-edit-choice">${esc(t("common.cancel"))}</button></div>
  </div>` : "";
  return shell(`<h1 class="page-title">${esc(t("pitch.title"))}</h1><p class="page-intro">${esc(t("pitch.approved"))}</p>${draftChoice}${profileDocument(runtime.profile.profile, false)}<div class="pitch-new-action"><button class="button" data-action="create-new-pitch">${esc(t("pitch.new"))}</button><p class="subtle">${esc(t("pitch.newHint"))}</p></div>`, { nav: true, active: "pitch", action: `<button class="text-action" data-action="edit-pitch">${esc(t("pitch.edit"))}</button>` });
}

function startPublishedPitchEdit({ replaceDraft = false } = {}) {
  if (!runtime.profile?.profile) return;
  if (runtime.draft && runtime.draftMode !== "edit-published" && !replaceDraft) {
    runtime.pendingPitchEdit = true;
    render();
    requestAnimationFrame(() => document.querySelector(".draft-choice")?.focus?.());
    return;
  }
  if (!runtime.draft || runtime.draftMode !== "edit-published" || replaceDraft) {
    runtime.draft = structuredClone(runtime.profile.profile);
    invalidatePublishAttempt();
    setDraftMode("edit-published");
    setImportMode("edit");
    writeJson(DRAFT_KEY, runtime.draft);
  }
  runtime.pendingPitchEdit = false;
  navigate("/import");
}

async function loadProfile() {
  if (runtime.profileLoading) return;
  runtime.profileLoading = true;
  if (runtime.demo) {
    runtime.profile = { profile: sampleProfile(), profile_id: "demo-owner" };
    runtime.profileLoaded = true;
    runtime.profileLoading = false;
    queueMicrotask(render);
    return;
  }
  const sessionAtLoad = runtime.session;
  let loadedProfile = null;
  let loadError = null;
  try {
    loadedProfile = await api("/v1/profiles/me");
  }
  catch (error) {
    loadError = error;
  }
  if (runtime.session !== sessionAtLoad) {
    runtime.profileLoading = false;
    return;
  }
  runtime.profile = loadedProfile;
  if (loadError && loadError.status !== 404) setRuntimeError(loadError);
  runtime.profileLoaded = true;
  runtime.profileLoading = false;
  render();
}

function matchesScreen() {
  if (!runtime.matches) {
    loadMatches();
    return shell(`<div class="loading">${esc(t("matches.loading"))}</div>`, { nav: true, active: "matches" });
  }
  const visible = runtime.matches.filter((match) => match.state !== "not_now");
  if (!visible.length && runtime.matchesPollError) {
    stopMatchesPolling();
    return shell(`<div class="empty"><p class="eyebrow">${esc(t("matches.eyebrow"))}</p><h2>${esc(t("matches.paused"))}</h2><p>${esc(t("matches.pausedBody"))}</p></div>`, { nav: true, active: "matches" });
  }
  if (!visible.length && isRecentPublish()) {
    queueMicrotask(ensureMatchesPolling);
    return shell(`<div class="empty"><p class="eyebrow">${esc(t("matches.searchingEyebrow"))}</p><h2>${esc(t("matches.searchingTitle"))}</h2><p>${esc(t("matches.searchingBody"))}</p><p class="status-label" data-match-countdown aria-live="polite">${esc(t("matches.checking", { seconds: 6 }))}</p></div>`, { nav: true, active: "matches" });
  }
  if (!visible.length) {
    stopMatchesPolling();
    if (runtime.demo && runtime.matches.some((match) => match.state === "not_now")) {
      return shell(`<div class="empty"><p class="eyebrow">${esc(`${t("demo.marker")} · ${t("matches.eyebrow")}`)}</p><h2>${esc(t("matches.demoPassed"))}</h2><p>${esc(t("matches.demoPassedBody"))}</p></div>`, { nav: true, active: "matches" });
    }
    return shell(`<div class="empty"><p class="eyebrow">${esc(t("matches.eyebrow"))}</p><h2>${esc(t("matches.emptyTitle"))}</h2><p>${esc(t("matches.emptyBody"))}</p><button class="button primary" data-action="refresh-matches">${esc(t("matches.check"))}</button></div>`, { nav: true, active: "matches" });
  }
  stopMatchesPolling();
  const result = runtime.matchResult || { page: 1, total_pages: 1, total: visible.length, result_set_id: "" };
  const context = result.result_set_id ? `?set=${encodeURIComponent(result.result_set_id)}&page=${result.page}` : "";
  const pagination = result.total_pages > 1 ? `<nav class="pagination" aria-label="配對分頁"><a class="button quiet ${result.page <= 1 ? "disabled" : ""}" ${result.page > 1 ? `href="/matches?set=${encodeURIComponent(result.result_set_id)}&page=${result.page - 1}" data-link` : "aria-disabled=\"true\""}>${esc(t("matches.previous"))}</a><span>${esc(t("matches.page", { page: result.page, total: result.total_pages }))}</span><a class="button quiet ${result.page >= result.total_pages ? "disabled" : ""}" ${result.page < result.total_pages ? `href="/matches?set=${encodeURIComponent(result.result_set_id)}&page=${result.page + 1}" data-link` : "aria-disabled=\"true\""}>${esc(t("matches.next"))}</a></nav>` : "";
  return shell(`<div class="match-title-row"><div><h1 class="page-title">${esc(t("matches.title"))}</h1><p class="page-intro">${esc(t("matches.total", { count: result.total }))}</p></div><button class="text-action" data-action="refresh-matches">${esc(t("matches.refresh"))}</button></div><div class="match-list">${visible.map((match) => match.unavailable ? `<div class="match-card unavailable"><h2>${esc(t("match.unavailable"))}</h2><p>${esc(t("match.unavailableBody"))}</p></div>` : `<a class="match-card" href="/matches/${encodeURIComponent(match.match_id)}${context}" data-link><div class="match-card-head"><h2 class="animal-persona compact">${esc(peerPresentationName(match.peer))}</h2><div class="match-card-meta"><span class="status-label">${esc(match.state === "suggested" ? t("match.viewDetail") : matchStateLabel(match.state))}</span></div></div>${match.peer?.is_fixture ? `<div class="evidence"><span class="evidence-label">${esc(t("match.demoData"))}</span></div>` : ""}<p>${esc(match.peer.summary || match.explanation.what_we_both_care_about)}</p><p class="shared-signal">共同訊號：${esc(match.strongest_shared_signal || match.explanation.what_we_both_care_about)}</p></a>`).join("")}</div>${pagination}`, { nav: true, active: "matches" });
}

async function loadMatches({ polling = false } = {}) {
  const wasSearching = polling || (Array.isArray(runtime.matches) && runtime.matches.length === 0 && isRecentPublish());
  if (runtime.demo) {
    runtime.matches = isRecentPublish() && Date.now() - runtime.lastPublishAt < MATCH_POLL_INTERVAL_MS
      ? []
      : [structuredClone(runtime.demoMatch)];
    runtime.matchesPollError = false;
    if (wasSearching && runtime.matches.length) announce(t("matches.found", { count: 1, suffix: "" }));
    queueMicrotask(render);
    return;
  }
  try {
    const query = new URLSearchParams(location.search);
    const endpoint = `/v1/matches?${query.toString()}`;
    runtime.matchResult = await api(endpoint);
    runtime.matches = runtime.matchResult.matches || [];
    if (!query.get("set") && runtime.matchResult.result_set_id) {
      history.replaceState({}, "", `/matches?set=${encodeURIComponent(runtime.matchResult.result_set_id)}&page=${runtime.matchResult.page || 1}`);
    }
    runtime.matchesPollError = false;
    if (wasSearching && runtime.matches.length) announce(t("matches.found", { count: runtime.matches.length, suffix: runtime.locale === "en" && runtime.matches.length !== 1 ? "es" : "" }));
  }
  catch (error) {
    runtime.matches = [];
    runtime.matchesPollError = true;
    setRuntimeError(error);
    stopMatchesPolling();
  }
  render();
}

async function refreshMatches() {
  runtime.matchesPollError = false;
  if (runtime.demo) { runtime.matches = null; render(); return; }
  const currentSet = runtime.matchResult?.result_set_id;
  const endpoint = `/v1/matches/refresh${currentSet ? `?set=${encodeURIComponent(currentSet)}` : ""}`;
  runtime.matchResult = await api(endpoint, { method: "POST", body: "{}" });
  runtime.matches = runtime.matchResult.matches || [];
  history.replaceState({}, "", `/matches?set=${encodeURIComponent(runtime.matchResult.result_set_id)}&page=1`);
  render();
}

function matchDetailScreen(matchId) {
  if (!runtime.match || runtime.match.match_id !== matchId) {
    loadMatch(matchId);
    return shell(`<div class="loading">${esc(t("match.loading"))}</div>`, { nav: true, active: "matches" });
  }
  const match = runtime.match;
  const peerName = peerPresentationName(match.peer);
  const initial = peerName.slice(0, 1).toUpperCase();
  const explanation = match.explanation;
  const questions = [
    [t("match.q1"), explanation.what_we_both_care_about],
    [t("match.q2"), explanation.why_it_matters_now],
    [t("match.q3"), explanation.what_we_could_discuss],
  ];
  const demoMarker = runtime.demo || match.peer?.is_fixture ? `<div class="evidence"><span class="evidence-label">${esc(t("match.demoData"))}</span></div>` : "";
  const connectedBlock = match.state === "connected" ? `<div class="notice success" style="margin-bottom:18px">
      ${runtime.demo ? `<div class="evidence"><span class="evidence-label">${esc(t("match.demoAcceptance"))}</span></div>` : ""}
      <h2 style="margin:10px 0 6px">${esc(t("match.connected"))}</h2>
      <a class="button primary" href="/connections/${encodeURIComponent(match.connection_id || match.match_id)}" data-link>${esc(t("connection.open"))}</a>
      <div class="doc-field" style="margin-top:14px"><span class="field-label">${esc(t("match.start"))}</span><p>${esc(explanation.what_we_could_discuss)}</p></div>
    </div>` : "";
  let decisionArea;
  if (match.state === "connected") decisionArea = "";
  else if (match.state === "outgoing") decisionArea = `${runtime.demo ? `<div class="notice"><span class="evidence-label">${esc(t("demo.marker"))}</span><p style="margin:8px 0 0">${esc(t("match.waiting"))}</p></div><button class="button primary" style="margin-top:9px;width:100%" data-action="simulate-demo-accept">${esc(t("match.simulate"))}</button>` : `<div class="notice">${esc(t("match.sent"))}</div>`}`;
  else if (match.state === "not_now") decisionArea = `<div class="notice">${esc(t("match.passed"))}</div>`;
  else if (match.state === "unavailable") decisionArea = "";
  else if (match.state === "incoming") decisionArea = `<div class="notice">請使用邀請 Email 裡的專用頁面選擇接受或現在不要。</div>`;
  else if (match.can_invite) decisionArea = `<button class="button primary" style="width:100%" data-action="match-decision" data-decision="invite" data-match-id="${esc(matchId)}">${esc(t("match.invite", { name: peerName }))}</button>`;
  else if (match.peer?.is_fixture) decisionArea = `<div class="notice">${esc(t("match.fixtureOnly"))}</div>`;
  else decisionArea = "";
  const backQuery = location.search || (runtime.matchResult?.result_set_id ? `?set=${encodeURIComponent(runtime.matchResult.result_set_id)}&page=${runtime.matchResult.page}` : "");
  return shell(`<a href="/matches${backQuery}" data-link class="eyebrow" style="text-decoration:none">${esc(t("match.back"))}</a>
    ${demoMarker}
    <div class="person"><div class="initial">${esc(initial)}</div><div><h1 class="animal-persona compact">${esc(peerName)}</h1><p>${esc(match.peer.profile?.interests?.[0] || t("match.ownerPitch"))}</p></div></div>
    ${connectedBlock}
    ${publicProfileDocument(match.peer.profile)}
    <div class="question-card">${questions.map(([label, text]) => `<section class="question"><div class="step-label">${esc(label)}</div><h2>${esc(text)}</h2><div class="evidence">${explanation.evidence_labels.map((evidence) => `<span class="evidence-label">${esc(t("match.evidence", { label: evidenceLabel(evidence) }))}</span>`).join("")}</div></section>`).join("")}</div>
    <div class="provenance"><span>${esc(t("profile.conversation"))}</span><span>${esc(t("profile.approved"))}</span><span>${esc(t("profile.notVerified"))}</span></div>
    ${decisionArea}`, { nav: true, active: "matches" });
}

async function loadMatch(matchId) {
  if (runtime.demo && matchId === DEMO_MATCH_ID) { runtime.match = structuredClone(runtime.demoMatch); queueMicrotask(render); return; }
  try { runtime.match = await api(`/v1/matches/${encodeURIComponent(matchId)}${location.search}`); }
  catch (error) { setRuntimeError(error); runtime.match = { match_id: matchId, peer: { display_name: t("match.unavailable"), profile: {} }, explanation: { what_we_both_care_about: t("match.unavailableBody"), why_it_matters_now: "", what_we_could_discuss: "", evidence_labels: [] }, state: "unavailable" }; }
  render();
}

function invitationsScreen() {
  if (!runtime.invitations) {
    loadInvitations();
    return shell(`<div class="loading">${esc(t("invites.loading"))}</div>`, { nav: true, active: "invitations" });
  }
  const sections = [["invites.incoming", runtime.invitations.incoming], ["invites.outgoing", runtime.invitations.outgoing], ["invites.connected", runtime.invitations.connected]];
  return shell(`<h1 class="page-title invitations-title">${esc(t("invites.title"))}</h1>${sections.map(([label, items]) => `<div class="divider-label">${esc(t(label))} · ${items.length}</div><div class="match-list">${items.length ? items.map((match) => `<a class="match-card" href="${match.state === "connected" ? `/connections/${encodeURIComponent(match.connection_id)}` : `/matches/${encodeURIComponent(match.match_id)}`}" data-link><div class="match-card-head"><h2 class="animal-persona compact">${esc(peerPresentationName(match.peer))}</h2><span class="status-label">${esc(matchStateLabel(match.state))}</span></div><p>${esc(match.explanation?.what_we_both_care_about || match.peer?.summary || "")}</p></a>`).join("") : `<div class="notice">${esc(t("invites.empty"))}</div>`}</div>`).join("")}`, { nav: true, active: "invitations" });
}

async function loadInvitations() {
  if (runtime.demo) {
    const match = structuredClone(runtime.demoMatch);
    runtime.invitations = { incoming: [], outgoing: match.state === "outgoing" ? [match] : [], connected: match.state === "connected" ? [match] : [] };
    queueMicrotask(render);
    return;
  }
  try { runtime.invitations = await api("/v1/invitations"); }
  catch (error) { runtime.invitations = { incoming: [], outgoing: [], connected: [] }; setRuntimeError(error); }
  render();
}

function settingsScreen() {
  return shell(`<h1 class="page-title">${esc(t("settings.title"))}</h1><p class="page-intro">${esc(t("settings.intro"))}</p>
    ${runtime.profile ? `<div class="settings-group"><div class="divider-label">${esc(t("settings.visibility"))}</div><div class="visibility-options"><button class="button ${runtime.profile.visibility !== "private" ? "primary" : "quiet"}" data-action="set-visibility" data-visibility="public">${esc(t("settings.public"))}</button><button class="button ${runtime.profile.visibility === "private" ? "primary" : "quiet"}" data-action="set-visibility" data-visibility="private">${esc(t("settings.private"))}</button></div><p class="subtle">${esc(t("settings.privateWarning"))}</p>${runtime.profile.public_slug ? `<a href="/p/${encodeURIComponent(runtime.profile.public_slug)}" class="text-action">${esc(t("settings.publicLink"))}</a>` : ""}</div>` : ""}
    <div class="settings-group"><div class="divider-label">${esc(t("settings.computer"))}</div><div class="settings-row"><div><strong>${esc(t("settings.upload"))}</strong><div class="subtle">${esc(t("settings.uploadHint"))}</div></div><button data-action="create-upload-session">${esc(t("settings.create"))}</button></div></div>
    ${runtime.uploadSession ? `<div class="notice">${esc(t("settings.submitUrl"))}</div><div class="api-token">${esc(runtime.uploadSession.submit_url)}</div><div class="notice" style="margin-top:8px">${esc(t("settings.token", { expires: runtime.uploadSession.expires_at }))}</div><div class="api-token">${esc(runtime.uploadSession.upload_token)}</div><p class="subtle">${esc(t("settings.tokenHint"))} <code>{"profile": {…}, "locale": "${esc(runtime.locale)}"}</code></p>` : ""}
    <div class="settings-group"><div class="divider-label">${esc(t("settings.data"))}</div><div class="settings-row"><span>${esc(t("settings.delete"))}</span><button data-action="delete-profile">${esc(t("settings.deleteAction"))}</button></div><div class="settings-row"><span>${esc(t("settings.signout"))}</span><button data-action="signout">${esc(t("settings.signoutAction"))}</button></div></div>
    <div class="settings-group"><div class="divider-label">${esc(t("settings.info"))}</div><div class="settings-row"><a href="/privacy" data-link>${esc(t("settings.privacy"))}</a></div><div class="settings-row"><a href="/terms" data-link>${esc(t("settings.terms"))}</a></div><div class="settings-row"><a href="/support" data-link>${esc(t("settings.support"))}</a></div></div>`, { nav: true, active: "settings" });
}

function infoScreen(kind) {
  const copy = {
    privacy: ["settings.privacy", "privacy.body"],
    terms: ["settings.terms", "terms.body"],
    support: ["settings.support", "support.body"],
  }[kind];
  const support = kind === "support" ? (runtime.supportRequestId
    ? `<div class="notice success" role="status">${esc(t("support.sent", { id: runtime.supportRequestId }))}</div><button class="button quiet" style="margin-top:16px;width:100%" data-action="new-support-request">${esc(t("support.another"))}</button>`
    : `<form class="form" data-form="support-request"><label class="field"><span class="field-label">${esc(t("support.message"))}</span><textarea name="message" minlength="20" maxlength="5000" required placeholder="${esc(t("support.messagePlaceholder"))}"></textarea></label><label class="field"><span class="field-label">${esc(t("support.contact"))}</span><input name="contact" maxlength="320" placeholder="${esc(t("support.contactPlaceholder"))}"></label><button class="button primary" ${runtime.busy ? "disabled" : ""}>${esc(t(runtime.busy ? "support.sending" : "support.send"))}</button></form>`)
    : "";
  return shell(`<a href="/settings" data-link class="eyebrow" style="text-decoration:none">${esc(t("info.back"))}</a><h1 class="page-title">${esc(t(copy[0]))}</h1><p class="page-intro" style="color:var(--ink)">${esc(t(copy[1]))}</p>${support}`);
}

function render() {
  const app = document.getElementById("app");
  document.body.classList.remove("modal-open");
  document.documentElement.lang = runtime.locale;
  const skipLink = document.querySelector(".skip-link");
  if (skipLink) skipLink.textContent = t("skip");
  let path = location.pathname.replace(/\/$/, "") || "/";
  if (!runtime.session && !runtime.demo && !["/", "/signin", "/privacy", "/terms", "/support", "/accept"].includes(path)) {
    history.replaceState({}, "", "/signin");
    app.innerHTML = signinScreen();
    return;
  }
  if (path === "/review") {
    path = "/import";
    history.replaceState({}, "", path);
  }
  const needsProfileBootstrap = ["/assistant", "/handoff", "/import", "/pitch", "/matches", "/invitations", "/settings"].includes(path)
    || path.startsWith("/matches/") || path.startsWith("/connections/");
  if (runtime.session && needsProfileBootstrap && !runtime.profileLoaded) {
    app.innerHTML = shell(`<div class="loading" role="status">${esc(t("common.loading"))}</div>`);
    if (!runtime.profileLoading) queueMicrotask(loadProfile);
    return;
  }
  if (runtime.session && runtime.profileLoaded && (path === "/matches" || path.startsWith("/matches/")) && (!runtime.profile || runtime.profile.visibility === "private")) {
    path = "/pitch";
    history.replaceState({}, "", path);
    runtime.notice = runtime.profile ? "你的介紹目前是私人狀態；改為公開後才會顯示配對。" : "請先發布介紹，才能查看配對。";
  }
  if (path === "/" && (runtime.session || runtime.demo)) {
    if (runtime.demo || runtime.profileLoaded) {
      path = runtime.profile ? (runtime.profile.visibility === "private" ? "/pitch" : "/matches") : (runtime.demo && runtime.lastPublishAt) ? "/matches" : runtime.draft ? "/import" : "/assistant";
      history.replaceState({}, "", path);
    } else {
      app.innerHTML = shell(`<div class="loading">${esc(t("common.loading"))}</div>`);
      if (!runtime.homeRouting) {
        runtime.homeRouting = true;
        queueMicrotask(async () => {
          try { await routeReturningOwner({ replace: true }); }
          catch (error) {
            setRuntimeError(error);
            navigate(runtime.draft ? "/import" : "/assistant", { replace: true });
          }
          finally { runtime.homeRouting = false; }
        });
      }
      return;
    }
  }
  if (path === "/") app.innerHTML = startScreen();
  else if (path === "/signin") app.innerHTML = signinScreen();
  else if (path === "/assistant") app.innerHTML = assistantScreen();
  else if (path === "/handoff") app.innerHTML = handoffScreen();
  else if (path === "/import") app.innerHTML = importScreen();
  else if (path === "/pitch") app.innerHTML = pitchScreen();
  else if (path === "/matches") app.innerHTML = matchesScreen();
  else if (/^\/matches\/[^/]+$/.test(path)) app.innerHTML = matchDetailScreen(decodeURIComponent(path.split("/").pop()));
  else if (path === "/invitations") app.innerHTML = invitationsScreen();
  else if (path === "/settings") app.innerHTML = settingsScreen();
  else if (path === "/accept") app.innerHTML = acceptScreen();
  else if (/^\/connections\/[^/]+$/.test(path)) app.innerHTML = connectionScreen(decodeURIComponent(path.split("/").pop()));
  else if (["/privacy", "/terms", "/support"].includes(path)) app.innerHTML = infoScreen(path.slice(1));
  else { history.replaceState({}, "", "/"); render(); return; }
  queueMicrotask(() => {
    fitDocumentEditors();
    syncMemoryNoticeUi();
  });
}

document.addEventListener("click", async (event) => {
  const link = event.target.closest("a[data-link]");
  if (link) { event.preventDefault(); const target = new URL(link.href); navigate(`${target.pathname}${target.search}${target.hash}`); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  try {
    runtime.error = "";
    if (action === "begin") runtime.session ? await routeReturningOwner() : navigate("/signin");
    if (action === "demo-flow") { runtime.demo = true; clearDraftState(); clearHandoff(); runtime.demoDraft = false; runtime.profile = null; runtime.profileLoaded = false; runtime.matches = null; runtime.invitations = null; runtime.match = null; runtime.lastPublishAt = 0; resetDemoMatch(); writeJson(DEMO_KEY, { enabled: true }); writeJson(DEMO_DRAFT_KEY, null); writeJson(DEMO_PROFILE_KEY, null); writeJson(LAST_PUBLISH_KEY, null); navigate("/assistant"); }
    if (action === "change-email") { clearAuthFlow(); render(); }
    if (action === "resend-code") await resendVerificationCode();
    if (action === "select-ai") { runtime.selectedAi = button.dataset.ai; render(); }
    if (action === "switch-locale") await switchLocale();
    if (action === "create-prompt") {
      await createPrompt();
    }
    if (action === "launch-ai-with-prompt") await launchAiWithPrompt();
    if (action === "open-memory-notice") openMemoryNotice("open-memory-notice");
    if (action === "confirm-memory-notice" || action === "dismiss-memory-notice") closeMemoryNotice();
    if (action === "copy-prompt") await copyPrompt();
    if (action === "toggle-full-prompt") { runtime.showFullPrompt = !runtime.showFullPrompt; render(); }
    if (action === "go-import") navigate("/import");
    if (action === "load-sample") { runtime.draft = sampleProfile(); invalidatePublishAttempt(); setDraftMode("new"); setImportMode("edit"); runtime.demoDraft = true; writeJson(DRAFT_KEY, runtime.draft); writeJson(DEMO_DRAFT_KEY, true); render(); window.scrollTo(0, 0); }
    if (action === "resume-computer-draft") await resumeComputerDraft();
    if (action === "replace-json" && runtime.draft) { runtime.importJson = JSON.stringify(runtime.draft, null, 2); setImportMode("paste"); render(); window.scrollTo(0, 0); }
    if (action === "remove-profile-item" && runtime.draft && ARRAY_FIELDS.includes(button.dataset.field)) {
      runtime.draft[button.dataset.field].splice(Number(button.dataset.index), 1);
      invalidatePublishAttempt();
      writeJson(DRAFT_KEY, runtime.draft);
      render();
    }
    if (action === "add-profile-item" && runtime.draft && ARRAY_FIELDS.includes(button.dataset.field)) {
      const field = button.dataset.field;
      const maxItems = Number(PROFILE_SCHEMA_CONFIG?.core_fields?.[field]?.max_items || 8);
      if (runtime.draft[field].length < maxItems) runtime.draft[field].push("");
      invalidatePublishAttempt();
      writeJson(DRAFT_KEY, runtime.draft);
      render();
      requestAnimationFrame(() => document.querySelector(`[data-draft-field="${field}"][data-index="${runtime.draft[field].length - 1}"]`)?.focus());
    }
    if (action === "confirm-publish") {
      const form = button.closest('form[data-form="publish-profile"]');
      if (!form) throw new Error(t("error.publishPayload"));
      runtime.draft = profileFromForm(form);
      writeJson(DRAFT_KEY, runtime.draft);
      await publishProfile();
    }
    if (action === "edit-pitch") startPublishedPitchEdit();
    if (action === "confirm-edit-published") startPublishedPitchEdit({ replaceDraft: true });
    if (action === "resume-pitch-draft") { runtime.pendingPitchEdit = false; setDraftMode(runtime.draftMode || "new"); navigate("/import"); }
    if (action === "cancel-edit-choice") { runtime.pendingPitchEdit = false; render(); }
    if (action === "cancel-pitch-edit") { clearDraftState(); runtime.demoDraft = false; writeJson(DEMO_DRAFT_KEY, null); navigate("/pitch"); }
    if (action === "create-new-pitch") { clearDraftState(); clearHandoff(); runtime.demoDraft = false; writeJson(DEMO_DRAFT_KEY, null); navigate("/assistant"); }
    if (action === "refresh-matches") await refreshMatches();
    if (action === "retry-matches") { runtime.error = ""; runtime.matchesPollError = false; runtime.matches = null; render(); }
    if (action === "error-retry") await retryCurrentScreen();
    if (action === "error-dismiss") { runtime.error = ""; render(); }
    if (action === "error-matches") navigate("/matches");
    if (action === "error-create-pitch") navigate("/assistant");
    if (action === "error-change-email") { runtime.error = ""; clearAuthFlow(); render(); }
    if (action === "error-resend") { runtime.error = ""; await resendVerificationCode({ ignoreCountdown: true }); }
    if (action === "error-signin") { runtime.error = ""; clearAuthFlow(); history.replaceState({}, "", "/signin"); render(); requestAnimationFrame(() => document.querySelector('input[name="email"]')?.focus()); }
    if (action === "match-decision" && runtime.demo && button.dataset.decision === "not_now") {
      runtime.pendingMatchDecision = { matchId: button.dataset.matchId, decision: "not_now" };
      render();
      requestAnimationFrame(() => document.querySelector('[data-action="confirm-match-decision"]')?.scrollIntoView({ block: "center" }));
    } else if (action === "match-decision") await decideMatch(button.dataset.matchId, button.dataset.decision);
    if (action === "cancel-match-decision") { runtime.pendingMatchDecision = null; render(); }
    if (action === "confirm-match-decision") { runtime.pendingMatchDecision = null; await decideMatch(button.dataset.matchId, "not_now"); }
    if (action === "simulate-demo-accept") connectDemoMatch();
    if (action === "write-connection-email") await launchConnectionEmailPrompt(button.dataset.ai);
    if (action === "create-upload-session") { runtime.uploadSession = await api("/v1/upload-sessions", { method: "POST", body: "{}" }); render(); }
    if (action === "respond-token") await respondInvitation(button.dataset.decision);
    if (action === "set-visibility") await setProfileVisibility(button.dataset.visibility);
    if (action === "delete-profile") await deleteProfile();
    if (action === "signout") signout();
    if (action === "new-support-request") { runtime.supportRequestId = null; render(); }
  } catch (error) {
    setRuntimeError(error);
    render();
    focusErrorNotice();
  }
});

document.addEventListener("keydown", (event) => {
  if (!runtime.memoryNoticeOpen) return;
  const dialog = document.querySelector(".memory-modal[role=dialog]");
  if (!dialog) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeMemoryNotice();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!dialog.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches('input[name="code"]')) {
    runtime.verificationCode = event.target.value.replace(/\D/g, "").slice(0, 6);
    if (event.target.value !== runtime.verificationCode) event.target.value = runtime.verificationCode;
  }
  if (event.target.matches('input[name="email"]')) runtime.signinEmail = event.target.value;
  if (event.target.matches('textarea[name="json"]')) runtime.importJson = event.target.value;
  const field = event.target.dataset?.draftField;
  if (field && runtime.draft && FIELD_ORDER.includes(field)) {
    if (ARRAY_FIELDS.includes(field)) runtime.draft[field][Number(event.target.dataset.index)] = event.target.value;
    else runtime.draft[field] = event.target.value;
    invalidatePublishAttempt();
    writeJson(DRAFT_KEY, runtime.draft);
    fitDocumentEditor(event.target);
  }
});

document.addEventListener("change", (event) => {
  const field = String(event.target.name || "");
  if (!event.target.closest('form[data-form="publish-profile"]') || !field.startsWith("confidence.") || !runtime.draft?.confidence) return;
  runtime.draft.confidence[field.slice("confidence.".length)] = event.target.value;
  invalidatePublishAttempt();
  writeJson(DRAFT_KEY, runtime.draft);
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  if (form.dataset.form === "publish-profile") return;
  const formData = new FormData(form);
  if (form.dataset.form === "request-code") runtime.signinEmail = String(formData.get("email") || "").trim();
  if (form.dataset.form === "confirm-code") {
    runtime.verificationCode = String(formData.get("code") || "").replace(/\D/g, "").slice(0, 6);
    if (!/^\d{6}$/.test(runtime.verificationCode)) {
      runtime.codeError = t("signin.codeShort");
      render();
      requestAnimationFrame(() => document.querySelector('input[name="code"]')?.focus());
      return;
    }
  }
  runtime.busy = true;
  runtime.error = "";
  runtime.notice = "";
  runtime.codeError = "";
  render();
  try {
    if (form.dataset.form === "request-code") {
      await requestVerificationCode();
    } else if (form.dataset.form === "confirm-code") {
      const result = await api(`/v1/email-verifications/${encodeURIComponent(runtime.challengeId)}/confirm`, { method: "POST", body: JSON.stringify({ email: runtime.signinEmail, code: runtime.verificationCode }) });
      const confirmedEmail = runtime.signinEmail;
      const wasDemo = runtime.demo;
      if (wasDemo) {
        runtime.demo = false;
        runtime.matches = null;
        runtime.invitations = null;
        runtime.match = null;
        writeJson(DEMO_KEY, null);
        writeJson(DEMO_MATCH_KEY, null);
        writeJson(DEMO_PROFILE_KEY, null);
        writeJson(LAST_PUBLISH_KEY, null);
        runtime.lastPublishAt = 0;
      }
      if (runtime.demoDraft) {
        clearDraftState();
        runtime.demoDraft = false;
        writeJson(DEMO_DRAFT_KEY, null);
      }
      runtime.session = { accessToken: result.accessToken, email: confirmedEmail };
      writeJson(STORAGE_KEY, runtime.session);
      clearAuthFlow();
      runtime.profileLoaded = false;
      await routeReturningOwner();
    } else if (form.dataset.form === "parse-json") {
      runtime.draft = validateProfileClient(parseJsonCandidate(String(formData.get("json") || "")));
      invalidatePublishAttempt();
      setDraftMode("new");
      setImportMode("edit");
      runtime.demoDraft = false;
      writeJson(DRAFT_KEY, runtime.draft);
      writeJson(DEMO_DRAFT_KEY, null);
      window.scrollTo(0, 0);
    } else if (form.dataset.form === "support-request") {
      const result = await api("/v1/support-requests", { method: "POST", body: JSON.stringify({ category: "other", message: String(formData.get("message") || ""), contact: String(formData.get("contact") || "") }) });
      runtime.supportRequestId = result.requestId;
    }
  } catch (error) {
    if (form.dataset.form === "confirm-code" && error?.identifier === "invalid_or_expired_code") {
      if (runtime.challengeExpiresAt && Date.now() >= runtime.challengeExpiresAt) {
        setRuntimeError(userFacingError(t("signin.codeExpired"), "resend", t("signin.resend"), { identifier: error.identifier }));
      } else {
        runtime.error = "";
        runtime.codeError = t("signin.codeWrong");
        announce(runtime.codeError);
      }
    } else setRuntimeError(error);
  } finally {
    runtime.busy = false;
    render();
    if (runtime.error) focusErrorNotice();
  }
});

async function publishProfile() {
  runtime.busy = true;
  render();
  if (runtime.demo) {
    runtime.profile = { profile: structuredClone(runtime.draft), profile_id: "demo-owner", version_id: "demo-v1" };
    runtime.profileLoaded = true;
    writeJson(DEMO_PROFILE_KEY, runtime.profile);
    clearDraftState();
    runtime.demoDraft = false;
    resetDemoMatch();
    runtime.matches = null;
    runtime.lastPublishAt = Date.now();
    writeJson(LAST_PUBLISH_KEY, runtime.lastPublishAt);
    writeJson(DEMO_DRAFT_KEY, null);
    clearHandoff();
    runtime.busy = false;
    navigate("/matches");
    return;
  }
  const approvedProfile = structuredClone(runtime.draft);
  const attempt = publishAttemptForDraft();
  let result;
  try {
    result = await api("/v1/profile-versions", {
      method: "POST",
      headers: { "idempotency-key": attempt.idempotencyKey },
      body: JSON.stringify({ schema: "pitchyourowner.profile-publish.v1", profile: approvedProfile, locale: runtime.locale, consent: { approvedAt: attempt.approvedAt } }),
    });
  } catch (error) {
    runtime.busy = false;
    throw error;
  }
  runtime.profile = { profile: approvedProfile, profile_id: result.profile_id, version_id: result.version_id, public_slug: result.public_slug, visibility: "public", matching_state: "active" };
  runtime.profileLoaded = true;
  clearDraftState();
  runtime.demoDraft = false;
  runtime.matches = null;
  runtime.lastPublishAt = Date.now();
  writeJson(LAST_PUBLISH_KEY, runtime.lastPublishAt);
  writeJson(DEMO_DRAFT_KEY, null);
  clearHandoff();
  let matchingStarted = true;
  try { await api("/v1/matching-runs", { method: "POST", body: "{}" }); }
  catch (error) { matchingStarted = false; console.warn("Profile published; matching trigger will be retried from Matches", error); }
  runtime.busy = false;
  navigate("/matches");
  runtime.notice = t(matchingStarted ? "notice.published" : "notice.publishedMatchingPending");
  render();
}

async function decideMatch(matchId, decision) {
  if (runtime.demo && matchId === DEMO_MATCH_ID) {
    runtime.demoMatch.state = decision === "not_now" ? "not_now" : "outgoing";
    runtime.demoMatch.can_invite = false;
    saveDemoMatch();
    runtime.match = structuredClone(runtime.demoMatch);
    runtime.matches = [structuredClone(runtime.demoMatch)];
    runtime.invitations = null;
    if (decision === "not_now") {
      navigate("/matches");
      runtime.notice = t("notice.decisionPassed");
      announce(runtime.notice);
      render();
    } else {
      runtime.notice = t("match.demoSent");
      announce(runtime.notice);
      render();
      requestAnimationFrame(() => document.querySelector('[data-action="simulate-demo-accept"]')?.scrollIntoView({ block: "center" }));
    }
    return;
  }
  const result = await api(`/v1/matches/${encodeURIComponent(matchId)}/invitations`, { method: "POST", body: JSON.stringify({ decision: "invite" }) });
  runtime.match = { ...runtime.match, state: result.state || "outgoing", can_invite: false };
  runtime.matches = null;
  runtime.invitations = null;
  runtime.notice = t("notice.invited");
  render();
}

function connectDemoMatch() {
  runtime.demoMatch.state = "connected";
  runtime.demoMatch.can_invite = false;
  runtime.demoMatch.peer.contact_email = "ren.demo@example.com";
  saveDemoMatch();
  runtime.matches = [structuredClone(runtime.demoMatch)];
  runtime.invitations = null;
  navigate(`/matches/${encodeURIComponent(runtime.demoMatch.match_id)}`);
  runtime.notice = t("match.demoAccepted");
  announce(runtime.notice);
  render();
}

async function deleteProfile() {
  if (!window.confirm(t("confirm.delete"))) return;
  try { await api("/v1/profiles/me", { method: "DELETE", body: JSON.stringify({ confirm: "DELETE" }) }); } catch (error) { if (error.status !== 404) throw error; }
  signout();
}

async function setProfileVisibility(visibility) {
  if (!['public', 'private'].includes(visibility) || !runtime.profile) return;
  const result = await api("/v1/profiles/me", { method: "PATCH", body: JSON.stringify({ visibility }) });
  runtime.profile = { ...runtime.profile, visibility: result.visibility, matching_state: result.matching_state, public_slug: result.public_slug || runtime.profile.public_slug };
  runtime.matches = null;
  runtime.matchResult = null;
  if (visibility === "public") {
    try { await api("/v1/matching-runs", { method: "POST", body: "{}" }); }
    catch (error) { setRuntimeError(error); }
  }
  runtime.notice = visibility === "public" ? "介紹已公開，配對已恢復。" : "介紹已設為私人，配對與新邀請已暫停。";
  render();
}

function signout() {
  runtime.session = null;
  runtime.profile = null;
  runtime.profileLoaded = false;
  runtime.matches = null;
  runtime.invitations = null;
  clearDraftState();
  runtime.demoDraft = false;
  runtime.demo = false;
  clearAuthFlow();
  clearHandoff();
  writeJson(STORAGE_KEY, null);
  writeJson(DEMO_DRAFT_KEY, null);
  writeJson(DEMO_KEY, null);
  writeJson(DEMO_MATCH_KEY, null);
  writeJson(DEMO_PROFILE_KEY, null);
  writeJson(LAST_PUBLISH_KEY, null);
  runtime.lastPublishAt = 0;
  runtime.matchesPollError = false;
  stopMatchesPolling();
  navigate("/");
}

async function routeReturningOwner({ replace = false } = {}) {
  try {
    runtime.profile = await api("/v1/profiles/me");
    runtime.profileLoaded = true;
    navigate(runtime.profile.visibility === "private" ? "/pitch" : "/matches", { replace });
  } catch (error) {
    if (error.status !== 404) throw error;
    runtime.profile = null;
    runtime.profileLoaded = true;
    navigate(runtime.draft ? "/import" : "/assistant", { replace });
  }
}

async function resumeComputerDraft() {
  const result = await api("/v1/profile-drafts");
  const draft = Array.isArray(result.drafts)
    ? [...result.drafts].sort((left, right) => String(right.createdAt || right.created_at || "").localeCompare(String(left.createdAt || left.created_at || "")))[0]
    : null;
  if (!draft?.profile) {
    runtime.notice = t("notice.computerNone");
    render();
    return;
  }
  runtime.draft = validateProfileClient(draft.profile);
  invalidatePublishAttempt();
  setDraftMode("new");
  setImportMode("edit");
  runtime.demoDraft = false;
  writeJson(DRAFT_KEY, runtime.draft);
  writeJson(DEMO_DRAFT_KEY, null);
  runtime.notice = t("notice.computerLoaded");
  render();
}

async function loadProfileSchemaConfig() {
  try {
    const response = await fetch("/pitchyourowner-profile-schema.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`schema config returned ${response.status}`);
    PROFILE_SCHEMA_CONFIG = await response.json();
    FIELD_ORDER = PROFILE_SCHEMA_CONFIG.field_order.filter((field) => field !== "confidence");
    ARRAY_FIELDS = Object.entries(PROFILE_SCHEMA_CONFIG.core_fields).filter(([, config]) => config.type === "string_array").map(([field]) => field);
    CONFIDENCE_FIELDS = PROFILE_SCHEMA_CONFIG.optional_fields.confidence.targets;
    CONFIDENCE_LEVELS = PROFILE_SCHEMA_CONFIG.optional_fields.confidence.allowed_values;
  } catch (error) {
    console.warn("Using embedded profile schema fallback", error);
  }
}

window.addEventListener("popstate", () => {
  if (location.pathname !== "/matches") stopMatchesPolling();
  if (location.pathname === "/matches") runtime.matches = null;
  render();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopMatchesPolling();
  else if (location.pathname === "/matches") ensureMatchesPolling();
  else if (location.pathname === "/handoff") { rehydrateHandoff(); render(); }
  else if (location.pathname === "/signin") ensureOtpCountdown();
});
window.addEventListener("pageshow", () => {
  if (location.pathname === "/handoff") { rehydrateHandoff(); render(); }
  if (location.pathname === "/signin") ensureOtpCountdown();
});
loadProfileSchemaConfig().finally(render);
