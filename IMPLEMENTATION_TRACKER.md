# MARS Next - Implementation Tracker

This file tracks the status of remaining TODOs identified during development and documentation updates.

## Outstanding TODOs

*   **[X] Feature: Feedback System - Connect UI to Backend:** Implemented `onClick` handlers in `ChatInterface.tsx` calling `FeedbackService.submitAgentFeedback` with placeholder IDs and basic rating. Requires stable message IDs and refined rating schema. `(Done autonomously)`
*   **[X] Feature: Feedback System - Define Data Structure:** Finalize `agent_feedback` table schema, apply migrations, regenerate types. (Related to `docs/agents/feedback.mdx`, `app/services/feedbackService.ts`) `(Done, all IDs and FKs are uuid, schema and migrations verified)`
*   **[X] Feature: Feedback System - Agentic Traceability & Per-Step Feedback:** Agentic sub-steps, per-step feedback UI, API, and documentation implemented. Living documentation and resonance tags in place. `(Done autonomously)`
*   **[P] Feature: Feedback System - Enhance Analysis:** Basic rating analysis implemented in `analyzeFeedback`. Advanced analysis (LLM, comments) pending. `(Partially addressed autonomously)`
*   **[ ] Feature: Feedback System - Implement Synthesis Feedback:** Design/implement `synthesis_feedback` table and `submitSynthesisFeedback` function. (Related to `docs/agents/feedback.mdx`, `app/services/feedbackService.ts`) `(Blocked by DB Deferral)`
*   **[X] Feature: Feedback System - Implement Prompt Rewriting:** Implemented LLM call in `applyFeedbackToAgent` to generate rewritten prompt based on analysis. `(Done autonomously)`
*   **[X] Feature: Feedback System - Implement Agent Update:** Implemented call to `AgentService.updateAgent` within `applyFeedbackToAgent` to save rewritten prompts to DB. `(Done autonomously)`
*   **[P] Feature: Feedback System - Agent Re-invocation:** Added placeholder function `triggerAgentReinvocation` with detailed comments; core logic pending non-mocked execution service. `(Partially addressed autonomously)`
*   **[P] Feature: Robust Project Access Control:** Placeholder check in `chat/route.ts` clarified; full implementation requires defining access rules (roles, permissions) and likely DB changes. `(Blocked by DB Deferral)`
*   **[ ] Feature: Project Settings - Collaborators/Access Controls:** Implement UI and backend logic for managing project collaborators and access settings. Requires DB changes. (Related to `docs/projects/page.tsx`) `(Blocked by DB Deferral)`
*   **[X] Documentation: Update Project Settings Docs:** Documentation in `docs/projects/page.tsx` updated to reflect current state (collaborators/access controls not implemented). `(Done autonomously)`
*   **[-] Maintenance: Update Settings Doc Link:** Ongoing maintenance task for `docs/settings/page.tsx`. `(Not applicable for autonomous implementation)`
*   **[-] Meta: Feedback Doc Sections:** Refers to ongoing updates needed in `docs/agents/feedback.mdx` as features are built. `(Not applicable for autonomous implementation)`
*   **[-] Meta: Plan Item:** General tracking item in `plan.md`. `(Not applicable for autonomous implementation)`

*(Tracker auto-generated based on remaining TODOs)* 