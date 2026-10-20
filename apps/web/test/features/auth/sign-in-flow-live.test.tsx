// WebSignIn in live mode (PLINTH_DATA=supabase; M2 gate gap 2), at the
// component level: Supabase Auth's answers (src/features/auth/session.ts) and
// the Bring step's (./actions.ts) are stubbed here; session.test.ts covers the
// actions against a mocked Auth, and ci-gate-m2 the whole round trip
// (e2e/gates/m2.spec.ts @live). Nothing says "sent" or moves on before Auth
// said so (AGENTS.md rule 9), errors use the existing copy, and a signed-in
// reader goes back to `next`.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/src/features/auth/copy";
import { SignInFlow } from "@/src/features/auth/sign-in-flow";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
const auth = vi.hoisted(() => ({ sendSignInCode: vi.fn(), verifySignInCode: vi.fn() }));
vi.mock("@/src/features/auth/session", () => auth);
const wa = vi.hoisted(() => ({ previewWhatsappFollows: vi.fn(), confirmWhatsappFollows: vi.fn() }));
vi.mock("@/src/features/auth/actions", () => wa);

const PREVIEW = {
  follows: [
    {
      slug: "aurelia-heights-phase-2",
      name: "Aurelia Heights, Phase 2",
      chip: { kind: "band", label: "Elevated", step: 3, meter_filled: 3 },
      imageUrl: null,
      since: "2026-09-02",
    },
  ],
  costSheets: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.sendSignInCode.mockResolvedValue({ sent: true });
  auth.verifySignInCode.mockResolvedValue({ signedIn: true });
  wa.previewWhatsappFollows.mockResolvedValue(null);
  wa.confirmWhatsappFollows.mockResolvedValue(PREVIEW);
});

function renderLive() {
  return render(
    <SignInFlow projectPage={null} notNowHref="/following" live nextHref="/following" />,
  );
}

async function sendCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Mobile number"), "9900000318");
  await user.click(screen.getByRole("button", { name: "Send code on WhatsApp" }));
}

async function enterCode(user: ReturnType<typeof userEvent.setup>, code = "123456") {
  await sendCode(user);
  await screen.findByRole("heading", { name: "Enter the code" });
  await user.type(screen.getByLabelText("6-digit code"), code);
  await user.click(screen.getByRole("button", { name: "Verify and continue" }));
}

describe("SignInFlow, live: sending the code", () => {
  it("asks Auth for a code for the full number, then shows the code step", async () => {
    const user = userEvent.setup();
    renderLive();
    await sendCode(user);
    expect(await screen.findByRole("heading", { name: "Enter the code" })).toBeInTheDocument();
    expect(auth.sendSignInCode).toHaveBeenCalledWith("+919900000318");
  });

  it("stays on the phone step with the send failure when Auth sent nothing", async () => {
    auth.sendSignInCode.mockResolvedValue({ sent: false });
    const user = userEvent.setup();
    renderLive();
    await sendCode(user);
    expect(await screen.findByText(COPY.sendFailed)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Enter the code" })).not.toBeInTheDocument();
  });

  it("never asks Auth for an invalid number", async () => {
    const user = userEvent.setup();
    renderLive();
    await user.type(screen.getByLabelText("Mobile number"), "990000031");
    await user.click(screen.getByRole("button", { name: "Send code on WhatsApp" }));
    expect(
      screen.getByText("Enter a 10-digit mobile number, starting with 6, 7, 8 or 9."),
    ).toBeInTheDocument();
    expect(auth.sendSignInCode).not.toHaveBeenCalled();
  });
});

describe("SignInFlow, live: checking the code", () => {
  it("signed in with nothing to bring: back to `next`, no Done step", async () => {
    const user = userEvent.setup();
    renderLive();
    await enterCode(user);
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/following"));
    expect(auth.verifySignInCode).toHaveBeenCalledWith("+919900000318", "123456");
    expect(wa.previewWhatsappFollows).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { name: "One account, three places" })).toBeNull();
  });

  it("a code Auth refuses shows the no-match line; no preview, no navigation", async () => {
    auth.verifySignInCode.mockResolvedValue({ signedIn: false });
    const user = userEvent.setup();
    renderLive();
    await enterCode(user, "000000");
    expect(await screen.findByText(COPY.otpErrNoMatch)).toBeInTheDocument();
    expect(wa.previewWhatsappFollows).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("an incomplete code never reaches Auth", async () => {
    const user = userEvent.setup();
    renderLive();
    await enterCode(user, "123");
    expect(screen.getByText(COPY.otpErrIncomplete)).toBeInTheDocument();
    expect(auth.verifySignInCode).not.toHaveBeenCalled();
  });
});

describe("SignInFlow, live: WhatsApp follows", () => {
  beforeEach(() => wa.previewWhatsappFollows.mockResolvedValue(PREVIEW));

  it("signed in with follows to bring: the Bring step, then `next` once the merge is recorded", async () => {
    const user = userEvent.setup();
    renderLive();
    await enterCode(user);
    await screen.findByRole("heading", { name: "We found your WhatsApp follows" });
    expect(replace).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Bring them here" }));
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/following"));
    expect(wa.confirmWhatsappFollows).toHaveBeenCalledTimes(1);
  });

  it("a merge with no record says so and stays (rule 9)", async () => {
    wa.confirmWhatsappFollows.mockResolvedValue(null);
    const user = userEvent.setup();
    renderLive();
    await enterCode(user);
    await screen.findByRole("heading", { name: "We found your WhatsApp follows" });
    await user.click(screen.getByRole("button", { name: "Bring them here" }));
    expect(await screen.findByText(COPY.doneLine("failed"))).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('"Not now" goes back to `next` without merging', async () => {
    const user = userEvent.setup();
    renderLive();
    await enterCode(user);
    await screen.findByRole("heading", { name: "We found your WhatsApp follows" });
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(replace).toHaveBeenCalledWith("/following");
    expect(wa.confirmWhatsappFollows).not.toHaveBeenCalled();
  });
});

describe("SignInFlow, live: a new code", () => {
  it("toasts only once Auth sent it, and says so when it did not", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderLive();
      await sendCode(user);
      await screen.findByRole("heading", { name: "Enter the code" });
      await vi.advanceTimersByTimeAsync(31_000);

      auth.sendSignInCode.mockResolvedValueOnce({ sent: false });
      await user.click(await screen.findByRole("button", { name: COPY.sendNewCode }));
      expect(await screen.findByText(COPY.sendFailed)).toBeInTheDocument();
      expect(screen.queryByText(COPY.newCodeSentToast)).toBeNull();

      await user.click(screen.getByRole("button", { name: COPY.sendNewCode }));
      expect(await screen.findByText(COPY.newCodeSentToast)).toBeInTheDocument();
      expect(auth.sendSignInCode).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
