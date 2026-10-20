// T47 accept (WORK_BREAKDOWN §4 T47): "a 9-digit number shows the validation
// copy; Bring them here merges 2 follows; no checkbox starts ticked." The
// full phone -> code -> bring -> done run, at the component level (Playwright
// covers the rendered route in e2e/sign-in.spec.ts).
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ProjectPage } from "@/src/data";
import { buildWaFollows, type WaProjectFollow } from "@/src/features/auth/data";
import { SignInFlow } from "@/src/features/auth/sign-in-flow";

function fakePage(slug: string, name: string): ProjectPage {
  return {
    risk: { phase: { slug, name }, chip: { kind: "band", label: "Moderate", step: 2, meter_filled: 2 } },
    hero: { image_url: `/media/${slug}.jpg` },
  } as unknown as ProjectPage;
}

const AURELIA = fakePage("aurelia-heights-phase-2", "Aurelia Heights, Phase 2");
const KESTREL = fakePage("kestrel-park", "Kestrel Park");
const SAPPHIRE = fakePage("sapphire-grove-phase-1", "Sapphire Grove, Phase 1");
const WA_FOLLOWS = buildWaFollows(AURELIA, KESTREL);
const WA_PROJECTS = WA_FOLLOWS.slice(0, 2) as [WaProjectFollow, WaProjectFollow];

function renderFlow(projectPage: ProjectPage | null = SAPPHIRE) {
  return render(
    <SignInFlow
      projectPage={projectPage}
      waProjects={WA_PROJECTS}
      waFollows={WA_FOLLOWS}
      notNowHref="/gurugram/projects/sapphire-grove-phase-1"
    />,
  );
}

async function sendValidCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Mobile number"), "9900000318");
  await user.click(screen.getByRole("button", { name: "Send code on WhatsApp" }));
}

describe("SignInFlow: phone step", () => {
  it("shows the validation copy for a 9-digit number", async () => {
    const user = userEvent.setup();
    renderFlow();
    await user.type(screen.getByLabelText("Mobile number"), "990000031");
    await user.click(screen.getByRole("button", { name: "Send code on WhatsApp" }));
    expect(
      screen.getByText("Enter a 10-digit mobile number, starting with 6, 7, 8 or 9."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Enter the code")).not.toBeInTheDocument();
  });

  it("moves to the code step for a valid 10-digit number", async () => {
    const user = userEvent.setup();
    renderFlow();
    await sendValidCode(user);
    expect(screen.getByRole("heading", { name: "Enter the code" })).toBeInTheDocument();
  });

  it("names the project being followed in the heading", () => {
    renderFlow(SAPPHIRE);
    expect(
      screen.getByRole("heading", { name: "Sign in to follow Sapphire Grove, Phase 1" }),
    ).toBeInTheDocument();
  });

  it("falls back to a generic heading with no project in context", () => {
    renderFlow(null);
    expect(screen.getByRole("heading", { name: "Sign in to Plinth" })).toBeInTheDocument();
  });

  it('"Not now, keep reading" points back at `next`', () => {
    renderFlow();
    expect(screen.getByRole("link", { name: "Not now, keep reading" })).toHaveAttribute(
      "href",
      "/gurugram/projects/sapphire-grove-phase-1",
    );
  });
});

describe("SignInFlow: code step", () => {
  it("requires all 6 digits before moving on", async () => {
    const user = userEvent.setup();
    renderFlow();
    await sendValidCode(user);
    await user.type(screen.getByLabelText("6-digit code"), "123");
    await user.click(screen.getByRole("button", { name: /Verify and follow/ }));
    expect(screen.getByText("Enter all 6 digits.")).toBeInTheDocument();
  });

  it("moves to Bring follows once all 6 digits are entered", async () => {
    const user = userEvent.setup();
    renderFlow();
    await sendValidCode(user);
    await user.type(screen.getByLabelText("6-digit code"), "123456");
    await user.click(screen.getByRole("button", { name: /Verify and follow/ }));
    expect(screen.getByRole("heading", { name: "We found your WhatsApp follows" })).toBeInTheDocument();
  });
});

async function reachBringStep(user: ReturnType<typeof userEvent.setup>) {
  await sendValidCode(user);
  await user.type(screen.getByLabelText("6-digit code"), "123456");
  await user.click(screen.getByRole("button", { name: /Verify and follow/ }));
}

describe("SignInFlow: bring follows", () => {
  it("starts with no checkbox ticked", async () => {
    const user = userEvent.setup();
    renderFlow();
    await reachBringStep(user);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  it("lists both WhatsApp projects and the cost sheet", async () => {
    const user = userEvent.setup();
    renderFlow();
    await reachBringStep(user);
    expect(screen.getByText("Aurelia Heights, Phase 2")).toBeInTheDocument();
    expect(screen.getByText("Kestrel Park")).toBeInTheDocument();
    expect(screen.getByText("Aurelia Heights, 3 BHK cost sheet")).toBeInTheDocument();
  });

  it('"Bring them here" merges both follows into the Done list', async () => {
    const user = userEvent.setup();
    renderFlow();
    await reachBringStep(user);
    await user.click(screen.getByRole("button", { name: "Bring them here" }));

    expect(screen.getByRole("heading", { name: "One account, three places" })).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Projects you follow" });
    expect(list).toHaveTextContent("Sapphire Grove, Phase 1");
    expect(list).toHaveTextContent("Aurelia Heights, Phase 2");
    expect(list).toHaveTextContent("Kestrel Park");
    expect(
      screen.getByText("Your WhatsApp follows are here now. The app and WhatsApp show the same list."),
    ).toBeInTheDocument();
  });

  it('"Not now" keeps only the new project in the Done list', async () => {
    const user = userEvent.setup();
    renderFlow();
    await reachBringStep(user);
    await user.click(screen.getByRole("button", { name: "Not now" }));

    const list = screen.getByRole("list", { name: "Projects you follow" });
    expect(list).toHaveTextContent("Sapphire Grove, Phase 1");
    expect(list).not.toHaveTextContent("Aurelia Heights, Phase 2");
    expect(
      screen.getByText("Your WhatsApp follows stay on WhatsApp. Bring them here any time from Your account."),
    ).toBeInTheDocument();
  });
});
