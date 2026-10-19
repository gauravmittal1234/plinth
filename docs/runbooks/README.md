# Runbooks

Step-by-step procedures for incidents and recurring operations. Each must be drilled once before public launch (BUILD_PLAN §3, M6 exit). Owner: the lead.

| Runbook | When | Status |
|---|---|---|
| `breach.md` | Personal-data breach: contain, assess, notify the Data Protection Board and affected users within 72 h (DPDP; BUILD_PLAN §13) | M6 |
| `takedown.md` | Legal notice or takedown request about a page, band or document (LN- refs) | M6 |
| `portal-change.md` | HARERA portal layout or data change: parse yield moves > 20% or data goes stale (BUILD_PLAN §11) | M6 |
| `notice.md` | Band-change governance: the 48-hour heads-up and the 7-day developer notice (BUILD_PLAN §6, M4) | M4 |
| `secret-exposure.md` | A key or token is exposed: rotate first, then tell the lead (SETUP_FOR_FOUNDER) | M2 |

Format: trigger, who acts, steps with commands, how to verify, who to tell, what to record in `ops.audit_log`.
