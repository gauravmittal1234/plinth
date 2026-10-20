// Captured logs: a LogSink that keeps every line, parsed, plus the raw text for leak checks.

import type { LogLevel, LogSink } from "../core/log.ts";

export interface LogLine {
  ts: string;
  level: LogLevel;
  fn: string;
  request_id: string | null;
  msg: string;
  [field: string]: unknown;
}

export interface CapturedLogs {
  sink: LogSink;
  lines: LogLine[];
  /** Every raw line joined, to assert that a value never reached the logs. */
  text(): string;
  find(msg: string): LogLine | undefined;
}

export function captureLogs(): CapturedLogs {
  const raw: string[] = [];
  const lines: LogLine[] = [];
  return {
    sink: (_level, line) => {
      raw.push(line);
      lines.push(JSON.parse(line) as LogLine);
    },
    lines,
    text: () => raw.join("\n"),
    find: (msg) => lines.find((l) => l.msg === msg),
  };
}
