import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignInForm } from "@/src/features/sign-in/sign-in-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const auth = {
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  getClaims: vi.fn(),
  signOut: vi.fn(),
  mfa: {
    listFactors: vi.fn(),
    enroll: vi.fn(),
    challenge: vi.fn(),
    verify: vi.fn(),
  },
};

vi.mock("@/src/lib/supabase/browser", () => ({ browserClient: () => ({ auth }) }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SignInForm", () => {
  it("sends an email code, never offering to create an account", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "ops@plinth.in");
    await user.click(screen.getByRole("button", { name: "Send a code" }));

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "ops@plinth.in",
      options: { shouldCreateUser: false },
    });
    expect(await screen.findByText(/We sent a code to ops@plinth.in/)).toBeInTheDocument();
  });

  it("walks a first-time admin through email OTP then TOTP enrollment to /ops", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    auth.verifyOtp.mockResolvedValue({ error: null });
    auth.getClaims
      .mockResolvedValueOnce({ data: { claims: { aal: "aal1" } }, error: null }) // after verifyOtp
      .mockResolvedValueOnce({
        data: { claims: { aal: "aal2", plinth_roles: ["admin"] } },
        error: null,
      }); // after mfa.verify
    auth.mfa.listFactors.mockResolvedValue({ data: { totp: [] }, error: null });
    auth.mfa.enroll.mockResolvedValue({
      data: { id: "factor-1", totp: { qr_code: "data:image/svg+xml,<svg/>", secret: "SECRET123" } },
      error: null,
    });
    auth.mfa.challenge.mockResolvedValue({ data: { id: "challenge-1" }, error: null });
    auth.mfa.verify.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "ops@plinth.in");
    await user.click(screen.getByRole("button", { name: "Send a code" }));
    await screen.findByLabelText("6-digit code");

    await user.type(screen.getByLabelText("6-digit code"), "123456");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText(/SECRET123/)).toBeInTheDocument();
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: "ops@plinth.in",
      token: "123456",
      type: "email",
    });
    expect(auth.mfa.enroll).toHaveBeenCalledWith({
      factorType: "totp",
      friendlyName: "Plinth admin",
    });

    await user.type(screen.getByLabelText("Code from your authenticator app"), "654321");
    await user.click(screen.getByRole("button", { name: "Finish setting up" }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/ops"));
    expect(auth.mfa.challenge).toHaveBeenCalledWith({ factorId: "factor-1" });
    expect(auth.mfa.verify).toHaveBeenCalledWith({
      factorId: "factor-1",
      challengeId: "challenge-1",
      code: "654321",
    });
  });

  it("signs out and denies an account without the admin role, even after TOTP", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    auth.verifyOtp.mockResolvedValue({ error: null });
    auth.getClaims.mockResolvedValueOnce({
      data: { claims: { aal: "aal2", plinth_roles: ["buyer"] } },
      error: null,
    });
    auth.signOut.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText("Email"), "buyer@plinth.in");
    await user.click(screen.getByRole("button", { name: "Send a code" }));
    await screen.findByLabelText("6-digit code");
    await user.type(screen.getByLabelText("6-digit code"), "111111");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("doesn't have the admin role");
    expect(auth.signOut).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
