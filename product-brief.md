# Product Brief: AI-Powered Talent Sourcing & Candidate Intelligence

## Overview

這是一個面向 headhunter、HR、founder 與 hiring manager 的 AI talent sourcing 平台。

使用者輸入 Job Description、role requirements，或以自然語言描述想找的人才。系統會根據需求，自動搜尋公開的 professional network、social media、developer ecosystem 與個人網站，找出潛在人選，再由 AI 分析候選人的背景、公開活動、實際作品與職缺需求之間的匹配程度。

最終產品不是單純提供候選人名單，而是輸出一份可直接用於 recruiting decision 的 candidate intelligence brief，讓使用者能快速理解：

* 這個人是誰
* 他目前在做什麼
* 為什麼可能適合這個職缺
* 有哪些公開 evidence 支持這個判斷
* 與 JD 的整體 match 程度
* 哪些判斷有高度信心，哪些仍存在 uncertainty

---

## Problem

Recruiting 的 sourcing workflow 仍然高度依賴人工搜尋與篩選。

Headhunter、recruiter 或 founder 通常需要在 LinkedIn、GitHub、社群平台、個人網站與其他公開來源之間切換，透過不同關鍵字與搜尋策略找人，再手動判斷候選人是否值得接觸。

這個流程有幾個主要問題：

### High Search Cost

找到真正適合的 candidate 往往需要大量時間。

尤其是 technical、AI、engineering、research 或 niche roles，適合的人不一定會在履歷或 LinkedIn headline 上直接標示相關關鍵字。

### Fragmented Information

一個人的資訊通常分散在不同平台。

例如：

* LinkedIn 顯示工作經歷
* GitHub 顯示實際 contribution
* Threads 或 X 顯示近期興趣與技術討論
* 個人網站顯示 side project
* conference、blog 或 community activity 顯示專業深度

Recruiter 很難有效地把這些資訊整合起來。

### Self-Reported Information Has Limited Signal

履歷與 professional profile 本質上屬於 self-reported information。

職稱、技能與經歷可以被包裝，但真正有價值的 hiring signal 往往存在於實際行為中，例如：

* 寫過什麼 code
* contribute 過哪些 repository
* 建過哪些 project
* 最近在研究什麼
* 公開討論過哪些問題
* 是否持續參與某個 technical community

### Keyword Search Misses High-Quality Candidates

很多強的 candidate 不一定符合標準 keyword query。

一個 recruiter 可能搜尋：

> AI Infrastructure Engineer

但真正適合的人可能只在 GitHub 上維護 inference tooling、最近在 Threads 討論 GPU scheduling，或在某個 startup 負責 model serving。

產品需要理解 underlying signals，而不只是 matching titles。

---

## Product Concept

使用者首先輸入：

* Job Description
* Hiring requirements
* Preferred background
* Must-have skills
* Nice-to-have skills
* Location constraints
* Seniority
* 其他自然語言需求

系統將需求拆解成一組 sourcing criteria 與 signals。

接著，AI agent 搜尋公開來源中的潛在人選，例如：

* LinkedIn
* Threads
* X / Twitter
* Facebook 公開內容
* GitHub
* Personal websites
* Portfolio
* Blog
* Open-source communities
* Public professional profiles

系統不只是搜尋「擁有某個職稱的人」，而是根據公開 activity 判斷誰可能實際符合需求。

---

## Example

假設一間公司正在招聘：

> Senior AI Infrastructure Engineer with experience in inference optimization, distributed systems, CUDA, and large-scale model serving.

系統可能找到：

* 最近持續討論 inference optimization 的工程師
* actively contributing to vLLM、TensorRT、CUDA tooling 或相關 repository 的 developer
* 曾經建立 internal model serving infrastructure 的工程師
* 經常分享 distributed systems、GPU scheduling 或 model deployment 技術內容的人
* 在相關 startup、research lab 或 infrastructure company 工作過的人

即使這些人的 LinkedIn title 並不是「AI Infrastructure Engineer」，系統仍然可以透過公開 evidence 判斷他們是否值得進一步研究。

---

## Candidate Intelligence

每位候選人會產生一份結構化 candidate brief。

### Identity

整理候選人的公開基本資訊，例如：

* Name
* Current role
* Company
* Location
* Professional background
* Relevant accounts

### Current Activity

分析候選人近期公開活動，包括：

* 最近在討論什麼
* 正在做什麼 project
* GitHub activity
* Recent repositories
* Open-source contributions
* Technical writing
* Public discussions
* Professional interests

這些資訊可以幫助 recruiter 理解候選人目前真正投入的方向，而不只是歷史履歷。

### Why This Person May Fit

根據 JD requirements，逐項解釋候選人可能符合的原因。

例如：

> Strong evidence of distributed systems experience through recent contributions to several infrastructure repositories.

> Has built developer-facing tooling and worked in small engineering teams, which may indicate strong fit for an early-stage founding engineer role.

### Supporting Evidence

每個主要判斷都附上可驗證的公開 evidence，例如：

* Social post
* GitHub repository
* GitHub contribution
* Open-source project
* Technical article
* Personal project
* Portfolio
* Professional experience
* Public talk

使用者可以直接查看原始來源。

### Match Assessment

系統對候選人進行 multidimensional scoring，例如：

* Technical Fit
* Domain Experience
* Seniority
* Industry Relevance
* Startup Experience
* Current Interests
* Evidence Strength
* Overall Match

同時標示判斷信心程度。

例如：

**Technical Fit: 92%**

Strong evidence from GitHub repositories and recent technical discussions.

**Startup Experience: 60%**

Some evidence of working in smaller teams, but limited public information.

這可以避免把 inference 當成 confirmed fact。

---

## Core User Experience

產品的核心 workflow 可以非常簡單。

### 1. Submit a JD

使用者貼上職缺需求：

> Looking for a founding engineer with strong full-stack skills, experience building AI products, and ideally exposure to developer tools.

### 2. AI Builds a Search Strategy

系統理解需求並拆解出 relevant signals：

* Full-stack engineering
* AI product experience
* Developer tooling
* Startup experience
* Small-team environment
* Evidence of shipping products
* High ownership

### 3. Search the Public Web

Agent 搜尋不同平台與公開來源。

### 4. Identify Candidates

系統進行 identity resolution，將不同平台可能屬於同一個人的資訊連結起來。

例如：

GitHub account

* LinkedIn profile
* Threads account
* Personal website

整合成一個 candidate profile。

### 5. Rank Candidates

根據 JD 與 evidence 對候選人排序。

### 6. Generate Candidate Briefs

產生一份 recruiter 可以快速閱讀的 candidate intelligence report。

---

## Example Candidate Output

### Candidate A

**Current Role**

Software Engineer at an AI startup.

**Relevant Signals**

* Maintains an open-source developer tool with 2,000+ GitHub stars
* Recently published content about building an LLM evaluation system
* Has contributed to multiple AI infrastructure repositories
* Previously worked at an early-stage startup
* Frequently discusses developer tooling and AI engineering

**Why This Person May Fit**

The candidate has direct evidence of building developer-facing software and working with AI infrastructure. Their recent activity also suggests strong interest in developer tools and hands-on product development.

**Evidence Strength**

High

**Overall Match**

87%

**Potential Gaps**

Limited public evidence regarding team leadership experience.

---

## Target Users

### Headhunters and Recruiting Agencies

這是最直接的 commercial use case。

Headhunter 的收入與成功 placement 高度相關，因此任何能夠：

* 提高 sourcing speed
* 找到更好的 candidate
* 擴大 candidate pool
* 提升 outreach quality

的工具，都有明確 ROI。

一個成功 placement 的 recruiting fee 可能遠高於軟體成本，因此 willingness to pay 相對明確。

### Internal Recruiters

適合需要持續招聘：

* Engineers
* AI talent
* Researchers
* Specialized technical roles
* Executive talent

的公司。

尤其對 hard-to-fill roles，candidate discovery 本身就是 recruiting bottleneck。

### Founders

Early-stage founder 常需要直接負責 hiring。

常見需求包括：

* Founding engineer
* Technical cofounder
* First designer
* Growth hire
* AI engineer
* Domain expert

Founder 通常沒有大型 recruiting team，因此需要能直接縮短搜尋時間的工具。

### Hiring Managers

Engineering manager、product leader 或 research lead 可以直接用自己的需求搜尋 candidate，而不需要完全依賴 recruiter。

### People Looking for Collaborators

產品也可以延伸至：

* 找 technical cofounder
* 找 research collaborator
* 找 open-source contributor
* 找 project partner
* 找 advisor
* 找 early team member

---

## Willingness to Pay

這個產品對使用者的價值可以直接連結到 economic outcome。

對 recruiter 而言，一個成功 placement 可能創造數千至數萬美元的收入。

對 founder 而言，一個關鍵 hire 可能直接影響公司的 product velocity、fundraising 或 execution capability。

因此，只要產品能做到以下任何一點，就具備明確的付費價值：

* 每週節省數小時 sourcing 時間
* 找到 LinkedIn search 不容易找到的人
* 增加 qualified candidate pool
* 提高 outreach-to-interview conversion
* 提高 recruiter placement rate
* 更快完成 hard-to-fill roles

產品的 ROI 可以直接透過 recruiting funnel 衡量。

---

## Key Differentiation

產品的核心價值可以濃縮成一句話：

> AI 主動找到你本來不知道的人，並提供可驗證的 evidence 告訴你為什麼值得聯絡。

核心能力分成三層。

### Discovery

從公開網路中找到高潛力 candidate，而不只是搜尋 recruiting database 中已經被結構化的人。

### Evidence

使用真實公開 activity 作為 candidate signal，包括：

* GitHub contribution
* Social content
* Projects
* Technical writing
* Community activity
* Professional history

### Reasoning

AI 根據 JD 將不同 signals 組合起來，解釋：

* 哪些 requirement 被滿足
* evidence 在哪裡
* 哪些部分存在 uncertainty
* 為什麼這個 candidate 值得 recruiter 花時間研究
* 也能看得出這個人平常有沒有跟AI協作的習慣

---

## Data and Identity Layer

一個重要的產品能力是 identity resolution。

同一個人可能同時存在於：

* GitHub
* LinkedIn
* Threads
* X
* Personal website
* Blog
* Conference speaker page
* Startup team page

系統需要判斷哪些 account 屬於同一個人，並將資訊整理成 unified talent profile。

長期可以逐步建立 talent graph，包括：

* Identity
* Skills
* Companies
* Projects
* Interests
* Communities
* Repositories
* Contributions
* Professional relationships
* Historical activity
* Role fit signals

這個 graph 可以成為 ranking 與 discovery 的基礎。

---

## Product Moat

模型本身未必是最重要的 moat。

更有價值的可能是：

### Talent Graph

跨平台建立完整的 professional identity 與 activity graph。

### Proprietary Ranking Signals

隨著使用者持續搜尋與選擇 candidate，系統可以學習：

* 哪些 signal 對特定職位最重要
* 哪些 candidate 最容易被 recruiter shortlist
* 哪些 evidence 與 interview conversion 相關
* 不同 industry 如何判斷 candidate quality

### Recruiter Feedback Loop

使用者行為本身可以形成 training signal，例如：

* Viewed
* Saved
* Rejected
* Contacted
* Replied
* Interviewed
* Hired

這些 feedback 可以讓 ranking engine 越來越準確。

---

## MVP

第一版可以聚焦 technical recruiting。

### Input

* Job Description
* Hiring criteria
* Optional natural-language instructions

### Data Sources

優先考慮：

* GitHub
* LinkedIn / public professional profiles
* X / Threads
* Personal websites
* Public technical content

### Output

每次搜尋提供約 10–30 名高潛力 candidate。

每個 candidate 包含：

* Basic profile
* Current role
* Relevant experience
* Recent activity
* GitHub information
* Supporting evidence
* JD match analysis
* Match score
* Confidence level
* Source links

---

## Primary Product Metric

最重要的 early-stage metric 不應只是搜尋量或 candidate 數量。

更有價值的指標是：

### Qualified Outreach Rate

> 搜尋結果中，有多少比例的 candidate 是使用者實際願意聯絡的？

例如：

系統推薦 20 人，其中 recruiter 認為 8 人值得 outreach。

Qualified Outreach Rate = 40%

這個 metric 直接衡量 discovery quality。

其他可以追蹤的 metrics 包括：

* Candidate Save Rate
* Outreach Rate
* Reply Rate
* Interview Rate
* Time to Shortlist
* Time Saved per Search
* Search-to-Hire Conversion

---

## Longer-Term Vision

產品可以逐步發展成完整的 AI recruiting agent。

Agent 可以處理：

1. Understand the JD
2. Build sourcing strategy
3. Discover candidates
4. Resolve identities
5. Research candidates
6. Rank candidates
7. Generate candidate briefs
8. Find contact information
9. Draft personalized outreach
10. Track replies
11. Update candidate pipeline
12. Learn from recruiter feedback
13. Automatically refine the search strategy

最終的使用體驗可以非常簡單：

> Find me 10 people I should talk to for this role.

Agent 負責完成後續所有 sourcing、research、ranking 與 recommendation。

---

## Product Thesis

Recruiting sourcing 本質上是一個 search、data aggregation、identity resolution、reasoning 與 ranking 的問題，因此非常適合由 AI agent 處理。

產品的核心價值，在於把分散於公開網路上的人才訊號轉化成 recruiter 可以直接採取行動的 candidate intelligence。

如果系統能夠持續找到 high-signal candidates，並用可信、可追溯的 evidence 解釋「為什麼這個人值得聯絡」，就有機會形成一個具備明確 ROI、明確付費者，以及高頻使用場景的 recruiting product。
