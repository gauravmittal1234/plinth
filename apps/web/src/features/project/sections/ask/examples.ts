// Two worked examples for the Ask Plinth panel, copied from the contract's
// own schema-valid fixtures (packages/contracts/examples/ask_answer/valid:
// aurelia-possession.json and should-i-buy-refusal.json — plinth.ask_answer/1,
// API_CONTRACTS §4.15). The `ask` edge function itself is M5 (BUILD_PLAN §1);
// until it ships, this section shows what it answers rather than inventing a
// live call this page can't make yet.
import type { AskAnswer } from "@plinth/contracts";

export const ASK_EXAMPLES: ReadonlyArray<{ question: string; answer: AskAnswer }> = [
  {
    question: "Will it be delivered on time?",
    answer: {
      schema: "plinth.ask_answer/1",
      thread_id: "6f0e2c1a-0000-4000-8000-000000000401",
      kind: "answer",
      disclosure_line:
        "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources.",
      sentences: [
        {
          text: "The original RERA completion date is Dec 2027, with no extensions so far.",
          cite: [1],
        },
        { text: "41% is built with 77% of the promised time used.", cite: [2] },
        {
          // Points at the risk answer rather than restating its range, so the
          // exact figure lives in one place (the risk section) and the two
          // never drift apart.
          text: "See “Will it be delivered on time?” above for how late similar Gurugram projects tend to run.",
          cite: [3],
        },
      ],
      sources: [
        { n: 1, label: "HARERA registration", fact_id: "00000000-0000-4000-8000-000000000010" },
        { n: 2, label: "HARERA QPR · Apr–Jun 2026", fact_id: "00000000-0000-4000-8000-000000000001" },
        { n: 3, label: "Plinth method v1.2", fact_id: "00000000-0000-4000-8000-000000000030" },
      ],
      cards: [],
      actions: [{ label: "Follow this project", action: "follow", href: null }],
      refusal_code: null,
      handoff: {
        label: "Talk to a Plinth adviser · free · developers never pay us",
        hours_line: "Mon–Sat 10 am–7 pm, usually within 4 working hours",
      },
      as_of_line: "Records as of 14 Oct 2026",
    },
  },
  {
    question: "Should I buy?",
    answer: {
      schema: "plinth.ask_answer/1",
      thread_id: "6f0e2c1a-0000-4000-8000-000000000402",
      kind: "refusal",
      disclosure_line:
        "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources.",
      sentences: [
        {
          text: "I can't tell you whether to buy. That's your call, and no developer pays us to steer it. Here's how to decide:",
          cite: [],
        },
        { text: "Can you carry a 12–24-month delay? See Can we afford the wait.", cite: [] },
        { text: "Read the 4 reasons behind the band, and what would change it.", cite: [] },
        {
          text: "Look at the lower-band projects nearby: Kestrel Park and Sapphire Grove, Phase 1.",
          cite: [],
        },
        {
          text: "Before paying anything, check the payee against the RERA collection account.",
          cite: [],
        },
      ],
      sources: [],
      cards: [],
      actions: [],
      refusal_code: "advice_buy_sell",
      handoff: {
        label: "Talk to a Plinth adviser · free · developers never pay us",
        hours_line: "Mon–Sat 10 am–7 pm, usually within 4 working hours",
      },
      as_of_line: "Records as of 14 Oct 2026",
    },
  },
];
