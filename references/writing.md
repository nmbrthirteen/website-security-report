# Writing the report

The reader is a security engineer scanning for numbers. Every string is a label or a value. Nothing else goes on the page.

## Labels and values

- A label names the control: `Failed sign-ins`, `Request body`, `Trusted device`.
- A value is the number and its unit, or the shortest exact phrase: `10`, `2 MB`, `30 days`, `Every account`, `Refused`.
- Thresholds carry their window in their own column or in the value: `10 in 15 min`.
- Units are spelled the same way everywhere: `min`, `hour`, `hours`, `days`, `MB`. Pick `1 h` or `1 hour` and keep it.
- Byte sizes use KB, MB and GB for 1,024 multiples, so `64 * 1024` is `64 KB`.
- Convert units only when the result is exact. `3,840 min` becomes `64 h`, never `3 days`.
- Headings name the topic only. `by default` belongs in values, never in a heading.
- Numbers are exact and use thousands separators: `1,800`, not `~2k`.
- Status codes stand alone: `429`, `403`. The harshest outcome in a column can be `**Blocked**`.
- Values state what production does today. Add `by default` when an operator can change it: `Open by default`. Never describe what a setting could do: `Limits who registers` is wrong when the list ships empty.
- Header names go in plain text, never in monospace. Monospace makes their hyphens read as dashes. A Header column of plain names is fine.
- Sentence case for titles, headings, labels and values. Acronyms stay as they are: `API`, `CSP`, `IPv6`.

## Rows, before and after

| Before | After | Why |
| --- | --- | --- |
| Email allowlist: Limits who registers | Email allowlist: Empty by default | States what production does, the list ships empty |
| Rate limit: About 2k per minute | API: 1,800 / min | Exact, with the traffic it applies to |
| Two-factor: None | Known limits: `Two-factor authentication is absent. Sign-in accepts a password alone.` | Absences are gaps, not settings |
| `Strict-Transport-Security`: `max-age=31536000; includeSubDomains` | Strict-Transport-Security: 1 year, subdomains included | Plain name, effect in words |
| Uploads: 50 MB (see note) | File upload: 50 MB, signed in | The note becomes part of the value |

## Name attacks and controls in words

| Write | Instead of |
| --- | --- |
| Union selects, time delays, stacked statements | `UNION SELECT`, `sleep(5)`, `; DROP TABLE` |
| Script tags, inline event handlers, embedded frames | `<script>`, `onerror=`, `<iframe>` |
| Parent directory walks, system file reads | `../`, `/etc/passwd` |
| Cloud metadata address, local file links | `169.254.169.254`, `file://` |
| WordPress login, admin and config paths | `/wp-login.php`, `/wp-admin`, `/wp-config.php` |
| Env files, Git folders, SSH keys | `/.env`, `/.git/config`, `/.ssh/id_rsa` |
| 1 year, subdomains included | `max-age=31536000; includeSubDomains` |
| Origin only on cross-site requests | `strict-origin-when-cross-origin` |
| DigitalOcean load balancer | `do-connecting-ip` |

## Never in the PDF

- Secrets, tokens, keys, or their lengths and formats
- Internal hostnames, private URLs, IP addresses, ports
- Account, project, cluster, bucket or database names and ids
- Webhook URLs and alert channel ids
- Env var and setting names
- Regexes, matching patterns or exact payload lists
- Names or emails of people

The evidence file may hold paths and internal names because it stays inside the team. The PDF may be forwarded.

## Never on the page

- A summary or tagline under the title
- A date or version line
- A sentence under a heading
- Footnotes, captions, legends
- A fact that only explains another row. If it matters, it becomes its own row

## Known limits

Two to six items, the most serious first. Each is one or two short sentences: the gap, then its effect.

- `Rate counters are per instance. Two instances double the effective limit.`
- `Admin country lock depends on a geo lookup. When the lookup fails, sign-in is refused.`

No reassurance after the gap, and no plan to fix it unless the user asks for one.

## Style

- No dashes as punctuation. Use a comma, a colon or two sentences. Hyphens in compound words are fine.
- No uppercase labels.
- No marketing words: robust, seamless, comprehensive, enterprise-grade, military-grade, bulletproof, state of the art.
- No hedging: write `Refused`, not `Generally refused`.
- The same word for the same thing on every page.
