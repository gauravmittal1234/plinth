// The admin shell's nav (this task's Build line: /ops now; /queue, /disputes,
// /notices and /inbox as placeholders for M3-M4, API_CONTRACTS §3.4).
export type AdminNavItem = {
  readonly href: string;
  readonly label: string;
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: "/ops", label: "Ops" },
  { href: "/queue", label: "Review queue" },
  { href: "/disputes", label: "Disputes" },
  { href: "/notices", label: "Notices" },
  { href: "/inbox", label: "WhatsApp inbox" },
];
