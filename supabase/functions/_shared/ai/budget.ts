// Daily AI budgets (T63; BUILD_PLAN §11 "alert at 80%, kill switch at 100%", FOUNDER_QUESTIONS M3-13).
//
// Before every live call the gateway reads api.ai_budget_status(p_task) (T60; service role only):
// today's live model calls and ₹ cost for the task, and the caps. The caps that apply are the
// stricter of the RPC's and the catalogue's (daily_call_cap, budget_inr_per_day). Then:
//   no cap at all              refuse (budget_unset): a task does not go live unbudgeted
//   use ≥ 100% of either cap   refuse (budget_exhausted): the kill switch
//   use ≥ 80% of either cap    allowed, with one warn line ("ai budget at 80%")
// The status cannot be read → refuse (budget_unavailable): live calls fail closed.

import type { Logger } from "../core/log.ts";
import { errorFields } from "../core/log.ts";
import type { RpcClient } from "../core/supabase.ts";
import { callRpc } from "../core/supabase.ts";
import type { AiTask } from "./catalogue.ts";
import { AiError } from "./errors.ts";

/** What api.ai_budget_status(p_task) returns (one jsonb object). */
export interface BudgetStatus {
  task: string;
  /** The IST date the counts are for. */
  day?: string;
  /** Live model calls today (retries count). */
  calls_today: number;
  cost_inr_today: number;
  daily_call_cap?: number | null;
  budget_inr_per_day?: number | null;
}

export interface BudgetVerdict {
  status: BudgetStatus;
  callCap: number | null;
  inrCap: number | null;
  /** The larger of calls/cap and ₹/budget (0–1+). */
  used: number;
  alert: boolean;
}

export const ALERT_AT = 0.8;

function stricter(a: number | null | undefined, b: number | null | undefined): number | null {
  const xs = [a, b].filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  return xs.length ? Math.min(...xs) : null;
}

function parseStatus(raw: unknown, task: AiTask): BudgetStatus {
  const s = raw as Partial<BudgetStatus> | null;
  if (!s || typeof s !== "object" || typeof s.calls_today !== "number") {
    throw new AiError("budget_unavailable", `api.ai_budget_status gave no counts for ${task.key}`);
  }
  return {
    task: typeof s.task === "string" ? s.task : task.key,
    day: s.day,
    calls_today: s.calls_today,
    cost_inr_today: typeof s.cost_inr_today === "number"
      ? s.cost_inr_today
      : Number(s.cost_inr_today ?? 0),
    daily_call_cap: s.daily_call_cap ?? null,
    budget_inr_per_day: s.budget_inr_per_day === null || s.budget_inr_per_day === undefined
      ? null
      : Number(s.budget_inr_per_day),
  };
}

/**
 * Reads the budget and decides; throws the refusal, warns at 80%. `pendingCalls` counts this
 * call's earlier attempts, which are not logged yet (the retry checks the budget again).
 */
export async function checkBudget(
  rpc: RpcClient,
  task: AiTask,
  log: Logger,
  pendingCalls = 0,
): Promise<BudgetVerdict> {
  let status: BudgetStatus;
  try {
    status = parseStatus(await callRpc(rpc, "ai_budget_status", { p_task: task.key }), task);
    status.calls_today += pendingCalls;
  } catch (err) {
    if (err instanceof AiError) throw err;
    log.error("ai budget unavailable", { task: task.key, ...errorFields(err) });
    throw new AiError("budget_unavailable", `api.ai_budget_status failed for ${task.key}`, {
      cause: err,
    });
  }
  const callCap = stricter(status.daily_call_cap, task.daily_call_cap);
  const inrCap = stricter(status.budget_inr_per_day, task.budget_inr_per_day);
  if (callCap === null && inrCap === null) {
    throw new AiError("budget_unset", `AI task ${task.key} has no daily call cap or ₹ budget`);
  }
  const ratios = [
    callCap === null ? 0 : callCap <= 0 ? Infinity : status.calls_today / callCap,
    inrCap === null ? 0 : inrCap <= 0 ? Infinity : status.cost_inr_today / inrCap,
  ];
  const used = Math.max(...ratios);
  const verdict: BudgetVerdict = { status, callCap, inrCap, used, alert: used >= ALERT_AT };
  const fields = {
    task: task.key,
    calls_today: status.calls_today,
    daily_call_cap: callCap,
    cost_inr_today: status.cost_inr_today,
    budget_inr_per_day: inrCap,
    used_pct: Number.isFinite(used) ? Math.round(used * 100) : 100,
  };
  if (used >= 1) {
    log.error("ai budget exhausted; kill switch", fields);
    throw new AiError("budget_exhausted", `AI task ${task.key} used 100% of today's budget`);
  }
  if (verdict.alert) log.warn("ai budget at 80%", fields);
  return verdict;
}
