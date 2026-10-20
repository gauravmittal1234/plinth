// WebPrivacy's own read (T51; AGENTS.md "pages import only from @/src/data").
// `who_has_my_number` is the one record of who can reach the buyer; `about`
// supplies the money lines, the grievance officer and the "download my data"
// promise, so this page never composes a money or SLA fact of its own.
import "server-only";
import { about, whoHasMyNumber, type About, type WhoHasMyNumber } from "@/src/data";

export type PrivacyData = {
  numbers: WhoHasMyNumber;
  money: About["money"];
  grievance: About["grievance"];
  /** `about().response_times` row for "Download my data" (API_CONTRACTS, DESIGN §5b). */
  downloadPromise: string;
};

const DOWNLOAD_ROW = "Download my data";
const DOWNLOAD_FALLBACK = "Ready within 24 hours; the link works for 7 days.";

export async function loadPrivacyData(): Promise<PrivacyData> {
  const [numbers, aboutData] = await Promise.all([whoHasMyNumber(), about()]);
  const downloadPromise =
    aboutData.response_times.find((row) => row.what === DOWNLOAD_ROW)?.promise_line ??
    DOWNLOAD_FALLBACK;
  return { numbers, money: aboutData.money, grievance: aboutData.grievance, downloadPromise };
}
