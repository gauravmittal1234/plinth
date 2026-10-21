// The hero's Follow button (M2 gate gap A): fixture mode keeps today's
// plain link to sign-in untouched; live mode follows through the shared
// server action and only ever shows "Following" once that RPC actually
// answered so (AGENTS.md rule 9). The live round trip against a real
// backend runs in ci-gate-m2 (e2e/gates/m2.spec.ts @live).
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HERO_COPY } from "@/src/features/project/page/copy";
import { FollowButton } from "@/src/features/project/sections/hero/follow-button";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const followMock = vi.hoisted(() => ({ followProject: vi.fn() }));
vi.mock("@/src/features/auth/follow", () => followMock);

const SLUG = "kestrel-park";
const NAME = "Kestrel Park";
const SIGN_IN_HREF = "/sign-in?next=/gurugram/projects/kestrel-park";

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
});

describe("FollowButton, fixture mode", () => {
  it("is a plain link to sign-in, exactly as today, and never calls the action", () => {
    render(<FollowButton slug={SLUG} name={NAME} live={false} signInHref={SIGN_IN_HREF} />);
    const link = screen.getByRole("link", { name: "Follow" });
    expect(link).toHaveAttribute("href", SIGN_IN_HREF);
    expect(followMock.followProject).not.toHaveBeenCalled();
  });
});

describe("FollowButton, live mode", () => {
  it("follows directly when already signed in, and shows Following only once the RPC answered", async () => {
    followMock.followProject.mockResolvedValue({ outcome: "followed", follow: {} });
    const user = userEvent.setup();
    render(<FollowButton slug={SLUG} name={NAME} live signInHref={SIGN_IN_HREF} />);
    const button = screen.getByRole("button", { name: "Follow" });
    await user.click(button);
    expect(await screen.findByRole("button", { name: "Following" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const [slug, clientId] = followMock.followProject.mock.calls[0] as [string, string];
    expect(slug).toBe(SLUG);
    expect(clientId).toMatch(/^[0-9a-f-]{36}$/);
    expect(push).not.toHaveBeenCalled();
  });

  it("a signed-out click answers auth_required: off to the same sign-in href, never a fake follow", async () => {
    followMock.followProject.mockResolvedValue({ outcome: "auth_required" });
    const user = userEvent.setup();
    render(<FollowButton slug={SLUG} name={NAME} live signInHref={SIGN_IN_HREF} />);
    await user.click(screen.getByRole("button", { name: "Follow" }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith(SIGN_IN_HREF));
    expect(screen.queryByRole("button", { name: "Following" })).toBeNull();
  });

  it("any other failure shows the existing copy, never a fake follow", async () => {
    followMock.followProject.mockResolvedValue({ outcome: "error" });
    const user = userEvent.setup();
    render(<FollowButton slug={SLUG} name={NAME} live signInHref={SIGN_IN_HREF} />);
    await user.click(screen.getByRole("button", { name: "Follow" }));
    expect(await screen.findByText(HERO_COPY.followFailed(NAME))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Following" })).toBeNull();
  });

  it('shows "Following" at once when the sign-in flow just followed it (the one-shot flag)', () => {
    sessionStorage.setItem(`plinth:followed:${SLUG}`, "1");
    render(<FollowButton slug={SLUG} name={NAME} live signInHref={SIGN_IN_HREF} />);
    expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument();
    // One-shot: a later unrelated mount of the same button doesn't replay it.
    expect(sessionStorage.getItem(`plinth:followed:${SLUG}`)).toBeNull();
    expect(followMock.followProject).not.toHaveBeenCalled();
  });
});
