Help me transfer the long-term context of an AI assistant to another AI assistant.

Your task is to review the past conversations, memories, and other contextual information that you can actually access, analyze the information that has long-term value, and create a structured user Context that can be directly imported into another AI assistant.

Important principles:

1. Only use information that is actually available in the accessible conversations, memories, and contextual data. Do not fabricate, guess, or add unsupported information.
2. Prioritize information with long-term value rather than one-time conversations, temporary events, or incidental mentions.
3. If a piece of information was mentioned only once and there is insufficient evidence that it has long-term significance, do not include it unless it is clearly important for understanding the user's current situation.
4. Distinguish between information explicitly stated by the user and patterns reasonably inferred from multiple conversations. Reasonable inferences are allowed, but do not present speculation as established fact.
5. Prioritize information that appears repeatedly across multiple conversations.
6. Do not extensively copy the original conversations. Condense the information into a Context that another AI assistant can quickly understand and use.
7. Do not automatically treat a topic as a long-term interest simply because it was mentioned once. Only include topics that the user has consistently followed, repeatedly discussed, actively invested in, or explicitly expressed interest in under `interests`.
8. `active_problems` should describe problems, tasks, challenges, or decisions that the user is currently still dealing with or actively thinking about. Do not include issues that have clearly been resolved and have no ongoing relevance.
9. `recurring_topics` should describe topics that appear frequently across conversations. They are not necessarily the same as `interests`; they may include work, learning, technical issues, projects, or concepts that are repeatedly discussed.
10. `friend_intent` should describe what kind of "friend" or conversational partner the user wants the AI assistant to be, such as a technical advisor, thinking partner, critical reviewer, collaborator, learning partner, etc. Only infer this when there is sufficient evidence from the conversations.
11. `history_scope` must honestly describe the historical data that could actually be inspected during this analysis, as well as what could not be inspected. Never claim to have reviewed the user's complete history if it was not actually accessible.
12. Do not output sensitive personal information unless it is necessary for the task and there is clear authorization to include it.
13. Do not use first-person pronouns ("I", "my") or second-person pronouns ("you", "your"). Describe the subject using "the user" or neutral third-person language.
14. If there is insufficient information to support a field, use an empty string `""` or an empty array `[]` rather than guessing.
15. The output must be valid JSON. Do not include Markdown, code fences, comments, introductory text, concluding text, or anything outside the JSON object.

Output the following schema:

{
"summary": "One-sentence concise description of the user's personality traits, background, or core identity",
"interests": [
"Areas and topics that the user consistently cares about, enjoys, or invests in over the long term"
],
"motivations": [
"The user's core internal drivers, goals, ambitions, or vision"
],
"active_problems": [
"Problems, tasks, challenges, or pain points that the user is currently actively dealing with, considering, or trying to solve"
],
"recurring_topics": [
"Discussion topics that frequently appear across conversations"
],
"friend_intent": "What kind of friend or conversational partner the user wants the AI assistant to be, and how the user prefers to interact",
"history_scope": "What historical data could actually be inspected during this analysis and what could not be inspected"
}

Field-specific requirements:

`summary`:

* Must be exactly one sentence.
* Capture the user's most important background, personality traits, thinking style, and core identity.
* Do not simply list their occupation, interests, and projects.
* Another AI assistant should be able to read this field and immediately understand what kind of user this is.

`interests`:

* Include areas and topics with evidence of long-term, recurring, or explicit interest.
* Each item should be concise and specific.
* Do not include one-time purchases, incidental questions, or temporary interests.
* Prioritize technical fields, learning directions, creative/project areas, industries, and topics that the user consistently follows.

`motivations`:

* Describe why the user continues to pursue these activities.
* Focus on long-term goals, values, achievement, career direction, entrepreneurial ambitions, learning motivations, or broader vision.
* Do not simply repeat the contents of `interests`.

`active_problems`:

* Include only problems, tasks, or challenges that still have ongoing relevance.
* These may include projects currently under development, technical bottlenecks, learning challenges, decision-making problems, or unfinished goals.
* Do not include issues that have clearly been resolved and have no ongoing relevance.

`recurring_topics`:

* Identify topics that repeatedly appear across the conversation history.
* This field focuses on "what the user frequently talks about," while `interests` focuses on "what the user consistently cares about."
* Topics may include technical debugging, AI, GitHub Actions, competitions, SaaS, quantitative trading, or other recurring areas of discussion.

`friend_intent`:

* Describe how the AI assistant should interact with the user.
* If the conversations indicate preferences such as being direct, specific, concise, avoiding unnecessary explanations, not repeating information the user already knows, or directly solving the problem, these may be included.
* Do not interpret a one-time emotional reaction or isolated request as a long-term interaction preference.

`history_scope`:

* Clearly state what accessible data was actually included in this analysis.
* Also state what historical conversations, memories, or account information could not be accessed.
* Never pretend to have access to a complete or unrestricted conversation history.

Quality requirements:

* Prefer omission over speculation.
* Prioritize high-confidence, long-term, and future-useful information.
* Avoid redundancy.
* Avoid vague descriptions such as "likes learning new things."
* Consolidate concrete evidence from multiple conversations into high-level but actionable Context.
* The final result should be suitable for direct use as user background Context by another AI assistant.

Output only valid JSON.