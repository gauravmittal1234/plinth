import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminFlag } from "@/src/data/types";
import { FlagsEditor } from "@/src/features/ops/flags-editor";
import { setFlagAction } from "@/src/features/ops/actions";

vi.mock("@/src/features/ops/actions", () => ({ setFlagAction: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

const FLAG: AdminFlag = {
  key: "since_replay_slider",
  enabled: false,
  rollout_pct: 100,
  audience: "anon",
  surfaces: ["web"],
  note: "Since you last looked.",
  updated_at: "2026-10-18T12:00:00+05:30",
};

describe("FlagsEditor", () => {
  it("shows each flag's key, note and on/off state", () => {
    render(<FlagsEditor flags={[FLAG]} />);
    expect(screen.getByText("since_replay_slider")).toBeInTheDocument();
    expect(screen.getByText("Since you last looked.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /since_replay_slider: off/i })).toBeInTheDocument();
  });

  it("flips a flag and keeps the server's written value (no confirmation without a record)", async () => {
    vi.mocked(setFlagAction).mockResolvedValue({ ok: true, enabled: true });
    const user = userEvent.setup();
    render(<FlagsEditor flags={[FLAG]} />);

    await user.click(screen.getByRole("button", { name: /since_replay_slider: off/i }));

    expect(setFlagAction).toHaveBeenCalledWith("since_replay_slider", true);
    expect(
      await screen.findByRole("button", { name: /since_replay_slider: on/i }),
    ).toBeInTheDocument();
  });

  it("rolls back the optimistic toggle and shows the error when the write fails", async () => {
    vi.mocked(setFlagAction).mockResolvedValue({ ok: false, error: "forbidden" });
    const user = userEvent.setup();
    render(<FlagsEditor flags={[FLAG]} />);

    await user.click(screen.getByRole("button", { name: /since_replay_slider: off/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("forbidden");
    expect(screen.getByRole("button", { name: /since_replay_slider: off/i })).toBeInTheDocument();
  });
});
