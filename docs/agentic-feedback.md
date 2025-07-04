# Agentic Feedback System

**Purpose:**
This document describes the agentic feedback and traceability system for the marsnext chat application. It covers the data model, UI, and API integration for granular, actionable feedback on agentic sub-steps within assistant messages.

**Status:** Living document (placeholder, to be expanded as implementation evolves)

## Overview
- Each assistant message may contain multiple agentic sub-steps (reasoning, synthesis, etc.), each with its own content, agent info, and unique step ID.
- Users can expand assistant messages to view these steps and provide feedback (rating, comment) on each step.
- Feedback is stored with traceability to the specific agentic step.

## To Do
- Expand with diagrams, API details, and usage examples as the system matures.

---
*This document is maintained as part of the living documentation process. Update as the implementation evolves.* 