// _shared/ai: the AI gateway at the edge (T63). Owner: T63; prompts/<task>/** belong to T69, T70.
//
// Usage (doc-check, T68): build an AiContext once per request with readAiEnv(), a service-role
// client (secretClient), flagsReader(...) and the request's logger, then call
// runTask("classify.document@1", input, ctx) or runReaders("extract.marketing_claims@1", input,
// ctx) and compare the readers with agree(). Nothing here sets a verdict: rules decide (SQL).
//
//   config.ts     AI_MODE, AI_PROVIDER_TIER, GEMINI_API_KEY (readAiEnv)
//   catalogue.ts  ai_tasks.json: tasks, readers, prompt versions, models, kill switches
//   input.ts      task input shape, normalisation, input SHA
//   pii.ts        PII stripping into stable tokens, Verhoeff, the in-process vault
//   wrap.ts       document text as fenced data (no instructions in the user turn)
//   schema.ts     response schemas: $ref inlining, Gemini responseSchema conversion
//   validate.ts   ajv output check, one retry then schema_mismatch
//   gemini.ts     generateContent over fetch (no SDK, no tools)
//   budget.ts     api.ai_budget_status: warn at 80%, refuse at 100%
//   log.ts        api.ai_generation_log with redacted output
//   recorded.ts   recorded responses and the fictional-sample manifest
//   prompts.ts    prompts/<task id>/<version>.md
//   gateway.ts    runTask, runReaders
//   agree.ts      reader A vs reader B with per-type normalisation
//   errors.ts     AiError and its codes

export * from "./agree.ts";
export * from "./budget.ts";
export * from "./catalogue.ts";
export * from "./config.ts";
export * from "./errors.ts";
export * from "./gateway.ts";
export * from "./gemini.ts";
export * from "./input.ts";
export * from "./log.ts";
export * from "./pii.ts";
export * from "./prompts.ts";
export * from "./recorded.ts";
export * from "./schema.ts";
export * from "./validate.ts";
export * from "./wrap.ts";
