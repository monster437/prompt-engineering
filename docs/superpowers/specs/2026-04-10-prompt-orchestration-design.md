# Prompt Templates and Orchestration Design

## 1. Goal
Design Task 9 for the image prompt workbench: a pure service-layer prompt orchestration module that builds mode-specific prompt templates, calls an OpenAI-compatible text provider, and returns a unified `PromptResult` without directly mutating workspace persistence.

This design intentionally stops at orchestration boundaries. Database updates remain in the API/workspace layer for later tasks.

## 2. Scope
### In scope
- Prompt template generation for `optimize`, `interview`, and `refine`
- A single orchestration entry point that selects templates and calls the provider adapter
- Consistent provider payload construction
- Interview follow-up stop rules with a maximum clarification round limit
- Unified structured JSON return contract using the existing `PromptResult`
- Unit tests for orchestration behavior and prompt-template injection

### Out of scope
- API route wiring
- Direct workspace persistence updates
- Frontend UI changes
- Image generation flow
- Multi-provider strategy beyond the current OpenAI-compatible adapter

## 3. Recommended approach
Use one shared orchestrator with separate prompt template builders.

### Why this approach
This fits the current codebase best:
- `providers/*` already isolates external API calling and response normalization
- `PromptResult` already exists as the app-facing normalized return shape
- API routes for generate/refine have not been implemented yet, so Task 9 can stay focused on pure orchestration

### Alternatives considered
#### A. One unified orchestrator with mode-specific templates (recommended)
- Pros: one contract, low duplication, easy to test, clean handoff to future API routes
- Cons: orchestrator contains some branching logic

#### B. Separate service per mode
- Pros: each flow is individually straightforward
- Cons: repeated provider wiring and repeated contract enforcement

#### C. Inline templates inside orchestration functions
- Pros: fastest to start
- Cons: prompt text and orchestration logic become tangled and harder to evolve

## 4. Module boundaries
Task 9 should use three distinct layers.

### 4.1 `src/lib/prompting/system-prompts.ts`
Responsibility:
- Generate mode-specific system prompts
- Encode language, target type, JSON output rules, and behavior rules

Non-responsibilities:
- No provider I/O
- No workspace persistence
- No response parsing

Proposed exports:
- `buildOptimizeSystemPrompt(...)`
- `buildInterviewSystemPrompt(...)`
- `buildRefineSystemPrompt(...)`

### 4.2 `src/lib/prompting/orchestrator.ts`
Responsibility:
- Provide one orchestration entry point for prompt generation/refinement
- Select the correct system prompt builder
- Build the provider payload
- Call the OpenAI-compatible provider adapter
- Enforce interview round-limit rules
- Return a unified `PromptResult`

Non-responsibilities:
- No direct database writes
- No route-layer request parsing
- No provider-specific HTTP logic

### 4.3 `src/lib/providers/*`
Responsibility:
- Send outbound requests
- Normalize provider responses into `PromptResult`

Non-responsibilities:
- No mode awareness
- No workspace-state mutation
- No prompt-template construction

## 5. Orchestrator contract
The orchestrator should accept one explicit input object rather than loose parameters.

### Proposed input shape
- `action`: `"optimize" | "interview" | "refine"`
- `workspace`:
  - `mode`
  - `outputLanguage`
  - `selectedTargetType`
  - `sourcePrompt`
  - `questionMessages`
  - `answers`
  - `finalPrompt`
  - `parameterSummary`
  - `refineInstruction`
- `provider`:
  - `baseURL`
  - `apiKey`
  - `model`
  - `endpoint`

This keeps the orchestrator pure and easy to test: callers provide current state, and the orchestrator returns the next normalized result.

### Return shape
Return the existing `PromptResult`:
- `status`
- `question?`
- `finalPrompt?`
- `summary?`
- `contextSnapshot`

No persistence-aware fields should be added here.

## 6. Action-specific flows
### 6.1 Optimize flow
Input basis:
- `sourcePrompt`
- `outputLanguage`
- `selectedTargetType`

Behavior:
- Build the optimize system prompt
- Ask the model to strongly expand the user’s source idea
- Require structured JSON output

Expected result:
- `status: "completed"`
- `finalPrompt`
- `summary`
- `contextSnapshot`

### 6.2 Interview flow
Input basis:
- `sourcePrompt`
- `questionMessages`
- `answers`
- `outputLanguage`
- `selectedTargetType`

Behavior:
- Build an interview system prompt that inspects whether the current information is sufficient
- If information is insufficient, ask exactly one high-value next question
- If information is sufficient, produce the final prompt and summary

Expected legal results before round limit:
- `status: "needs_clarification"` with `question`
- or `status: "completed"` with `finalPrompt`, `summary`, and `contextSnapshot`

### 6.3 Refine flow
Input basis:
- `finalPrompt`
- `parameterSummary`
- `refineInstruction`
- `outputLanguage`
- `selectedTargetType`

Behavior:
- Build a refine system prompt that edits the current prompt according to the user’s refine instruction
- Preserve useful context while updating the result

Expected result:
- `status: "completed"`
- updated `finalPrompt`
- updated `summary`
- updated `contextSnapshot`

## 7. Interview stop rule
The user chose a dual guardrail approach: the model decides when it has enough information, but the service imposes a hard maximum number of clarification rounds.

### Rule
- Clarification round count = `answers.length`
- Maximum clarification rounds = `3`

### Behavior before limit
If `answers.length < 3`, the provider may legally return either:
- `needs_clarification`
- `completed`

### Behavior at or beyond limit
If `answers.length >= 3`:
- The interview system prompt must explicitly instruct the model to stop asking questions and produce the best possible final result
- The orchestrator must still validate the returned `PromptResult`
- If the provider still returns `needs_clarification`, the orchestrator should throw a contract error rather than silently rewriting the response

### Why throw instead of auto-convert
Throwing keeps the contract explicit and makes provider violations visible during testing and integration. Silent rewriting would hide real prompt/provider failures.

## 8. Prompt template requirements
Each system-prompt builder should inject the same core rules, then add flow-specific instructions.

### Common required instructions
- Return JSON only
- Match the app’s `PromptResult` contract
- Include a structured `summary`
- Include a `contextSnapshot`
- Respect the chosen output language
- Write for the selected target prompt type

### Summary requirements
The model should be instructed to return a complete structured summary containing:
- `style`
- `scene`
- `time`
- `mood`
- `quality`
- `composition`
- `extras`

### Interview-specific instructions
- Ask at most one question per turn
- Ask only the highest-value missing detail
- Prefer completion once enough information is present
- When the max-round flag is active, do not ask another question

## 9. Provider payload strategy
The orchestrator should build a provider invocation and leave transport to the existing adapter.

### Recommended payload shape
Use a chat-completions-style payload by default for Task 9:
- `messages: [{ role: "system", content }, { role: "user", content }]`

For interview mode, the user message should include:
- original source prompt
- prior questions
- prior answers
- any instruction about whether further clarification is still allowed

For refine mode, the user message should include:
- current final prompt
- current summary
- refine instruction

### Why chat-completions first
The codebase already normalizes both `/v1/chat/completions` and `/v1/responses`, but Task 9 does not need to add another branching axis unless a provider config explicitly requires it later. Keep orchestration logic simple and let the provider config choose the endpoint.

## 10. Context snapshot design
The provider should continue returning a lightweight `contextSnapshot` for downstream stability.

Recommended contents:
- extracted subject or subject focus
- resolved style cues
- resolved scene cues
- missing-information hints if still clarifying
- any compact internal interpretation that helps later refine/interview steps

This should remain small and structured. It is not a transcript dump.

## 11. Error handling
The orchestrator should fail loudly for contract violations.

### Errors to treat as failures
- refine returns `needs_clarification`
- optimize returns `needs_clarification`
- interview over limit still returns `needs_clarification`
- provider returns malformed normalized data

### Errors to leave to lower layers
- HTTP failure from provider
- unsupported provider response shape
- JSON parsing failures in provider normalization

Those remain the responsibility of the provider adapter or normalization layer.

## 12. Testing strategy
Create `src/lib/prompting/orchestrator.test.ts` as the primary Task 9 test file.

### Required coverage
#### Optimize
- selects optimize prompt builder behavior
- builds a provider invocation with the expected model/endpoint
- returns a completed result

#### Interview
- allows `needs_clarification` before reaching the round limit
- includes the clarification-stop instruction once the round limit is reached
- throws if the provider still returns `needs_clarification` after the round limit

#### Refine
- uses `finalPrompt`, `parameterSummary`, and `refineInstruction`
- returns a completed result
- rejects clarification-style responses

#### Template injection
- output language appears in the system prompt
- selected target type appears in the system prompt
- common JSON contract instructions appear in all prompt templates

## 13. Files to add in Task 9
- `src/lib/prompting/system-prompts.ts`
- `src/lib/prompting/orchestrator.ts`
- `src/lib/prompting/orchestrator.test.ts`

Potentially update:
- `src/lib/prompting/contracts.ts` if Task 9 needs more explicit orchestration input types

## 14. Implementation notes for the next task
- Keep the orchestrator pure; do not import `db`
- Prefer explicit input/output types over raw `Record<string, unknown>`
- Keep prompt builders small and composable
- Do not add speculative abstractions for future image generation here

## 15. Success criteria
Task 9 is complete when:
- prompt-template builders exist for optimize/interview/refine
- one orchestrator entry point can run all three flows
- interview round limit is enforced at the orchestration layer
- the provider adapter is reused rather than bypassed
- orchestration tests cover optimize, interview, refine, and contract failures
