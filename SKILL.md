---
name: website-security-report
description: Reads the codebase and infrastructure config of a website or web app, finds every security control it enforces in production (WAF rules, rate limits, IP blocks, sign-in and 2FA, request limits, headers, block lists, isolation, logging, CI checks) and the stack with exact versions, then renders a clean A4 PDF for a security team plus an evidence file tying every number to the line of code that enforces it. Use whenever the user wants a security overview, security report, WAF or firewall doc, posture summary, pentest or audit kickoff pack, a list of "what protections do we have", or anything to show a security team about their limits, checks and stack, even if they never say PDF.
license: MIT
metadata:
  author: Nika Siradze
  site: https://nikusha.com
---

# Website security report

A security reviewer reads this PDF for three things: what is enforced, at what number, and where. Most security docs fail them by listing intentions, rounding numbers nobody checked, and pasting payloads and internal URLs. Here every row is a control that runs in production, every number was read from code in this run, and the page holds only headings, tables and rows. The proof sits beside it in an evidence file, so the PDF stays clean and every claim stays traceable.

## Workflow

Copy this checklist into your reply and tick it off as you go:

```
Report progress:
- [ ] 1. Map the system
- [ ] 2. Find the controls
- [ ] 3. Record evidence
- [ ] 4. Read stack versions
- [ ] 5. Write the report JSON
- [ ] 6. Check evidence (0 problems)
- [ ] 7. Render the PDF
- [ ] 8. Check every page image
- [ ] 9. Report to the user
```

**1. Map the system.** Find what serves traffic, in order: CDN or proxy, load balancer, apps, workers, data stores. Read the deploy config: Dockerfile, compose, IaC, platform specs like `vercel.json`, `fly.toml`, `app.yaml`, Terraform, nginx or Caddy. Production config wins over development config. This becomes the `flow` section.

**2. Find the controls.** Work through every group in [references/where-to-look.md](references/where-to-look.md). Open the handler behind each match and follow the value to where a request reaches it. A constant nothing imports is not a control, and a reviewer who finds one will distrust the rest.

**3. Record evidence** as you go, one row per value you plan to print, in `<name>.evidence.md`. See [Evidence file](#evidence-file). If you cannot point at a line, the value stays out of the PDF.

**4. Read stack versions** from lockfiles and image tags, never from `package.json` ranges. A range says what could install, the lockfile says what ships.

**5. Write the report JSON** in the shape from [references/format.md](references/format.md), using the sections below. Write every string by [references/writing.md](references/writing.md).

**6. Check evidence.** Run:

```bash
node <skill folder>/scripts/check-evidence.mjs <name>.evidence.md <repo root>
```

It prints one line per row: `ok` with the cited line of code, `absent` for a `Not found` row, or `missing`, `bad` or `range` for a broken citation. It ends with `N rows, N problems`. Read every `ok` line against its claim, since a valid line can still be the wrong line. Fix the evidence, re-run, and continue only at 0 problems.

**7. Render.** Run:

```bash
node <skill folder>/scripts/build.mjs <name>.json <name>.pdf
```

It validates the JSON first and lists each bad field by section. Fix those and re-run. On success it prints the PDF path and the page count. Bun runs all scripts too. It needs Chrome, Chromium or Edge. Set `CHROME_PATH` when it reports none.

**8. Check every page.** Run:

```bash
node <skill folder>/scripts/pages.mjs <name>.pdf
```

It writes `pages/page-1.png` and up next to the PDF and prints their paths. Open every image. A section split across pages, a page holding one stray section, or a wrapped flow label means going back to step 5. See "Fitting pages" in [references/format.md](references/format.md). Batch fixes and stop at five renders.

**9. Report** to the user: PDF path, evidence path, page count, dropped sections and why, controls the repo could not prove, and the gaps you found. Say the evidence file is for internal use.

## Sections

Start from this order. Drop a section the code gives nothing real for, since an empty or padded section reads as filler. Moving a section to fill a page is fine.

| Section | Kind | Holds |
| --- | --- | --- |
| Request flow | `flow` | Proxy, balancer, guards or apps, workers, data stores |
| Stack | `facts` | Parts and versions |
| Client IP | `facts` | Which header is trusted and how spoofing is stopped |
| Firewall rules | `table` | Rule and what it catches, in words |
| Rate limits | `table` | Traffic, limit, counter scope, what happens over it |
| Automatic IP blocks | `table` | Trigger, threshold, window |
| Block length | `steps` | Only when blocks escalate |
| Path probes | `facts` | Groups of probed paths, in words |
| Block lists | `table` | External lists, scope, refresh |
| API limits | `facts` | Body size, uploads, query limits, closed endpoints, CORS |
| Sign-in and admin access | `facts` | 2FA, lockouts, sessions, cookies, sign-up, geo or IP locks |
| Forms | `facts` | Captcha, honeypot, relay, origin checks |
| Security headers | `table` | Header and its effect, in words |
| Runtime isolation | `facts` | Containers, users, capabilities, networks, sandboxes, resource caps |
| Logging and alerts | `facts` | What is logged, retention, alert channels |
| Build and deploy | `facts` | CI checks, audits, image pinning, deploy gates, secret handling |
| Known limits | `list` | Two to six gaps, the most serious first |

**Known limits is required.** A report without weak spots reads as marketing, and the reviewer will find the gaps anyway. Look for per-instance counters, checks that fail open, paths a guard skips, trusted forwarded headers, protections off by default, and expected controls that are missing.

## Judgment calls

- **Production state.** Print what production does today. Where an operator can change it, add `by default`. The deploy workflow and production env files override compose and code defaults; record the code default in the evidence row.
- **Title.** Use the domain when the code or config names one, like `example.com security overview`. Fall back to the product name.
- **Library defaults** count when the app uses the library, never overrides the default, and the code path runs. Source is the app's call site; Enforced by names the library, version and default.
- **Absent controls** never appear as "None" in a section. They go in Known limits, with the evidence source `Not found: searched <terms> in <folders>`.
- **Versions.** Exact from lockfiles. A repo that pins only a major, like `node:22`, gets the major. In a monorepo, print the version the deployed service uses.
- **Size.** Up to three nodes per flow column, fourteen stack rows, sixteen rows in other sections. In Stack, drop build tools that never run in production first.
- **Development only** controls do not count. Optional hardening scripts the deploy never calls do not count either; when protection depends on someone running one, that is a Known limit.
- **Docs are not evidence.** A README or deploy doc can point you at code, but only code and config prove a control. A doc that contradicts the code is worth telling the user about.
- **Dashboard rules** in Cloudflare, a cloud console or a platform UI cannot be proved from the repo. Leave them out, list them for the user, and add a Known limit when protection depends on them.

## Evidence file

`<name>.evidence.md` answers "where is this enforced". It may name internals the PDF must not.

```markdown
# example.com security overview: evidence

| Section | Label | Value | Source | Enforced by |
| --- | --- | --- | --- | --- |
| Rate limits | API | 300 / min | src/server/limits.ts:4 | Per IP counter in src/server/middleware.ts:58, returns 429 with Retry-After |
| Known limits | Two-factor | Absent | Not found: searched totp, otp, 2fa, mfa, webauthn in src, packages | Sign-in accepts a password alone |
```

- One row per printed value, in PDF order. Flow nodes and Known limits items count as values.
- Source is one `path:line` or `path:start-end` from the repo root, or `Not found: ...` for an absence. A weak control in Known limits cites its real line.
- Further references go in Enforced by as `path:line`; the checker verifies those too.
- Write a pipe inside a cell as `\|`.
- A `## Notes` section after the table may hold findings that stayed out of the PDF.

## Before handing over

The PDF may be forwarded outside the team, so it must be safe and exact on its own:

- [ ] `check-evidence.mjs` ended at 0 problems and every `ok` line matches its claim
- [ ] Every value states production behaviour, unrounded
- [ ] Only the title, headings, tables, rows and Known limits are on the page
- [ ] No payloads, regexes, URLs, hostnames, IPs, ids, env var names or secrets in the PDF
- [ ] Known limits holds two to six real gaps
- [ ] Every page image was opened after the last render
- [ ] The PDF was handed to the user, never uploaded or sent anywhere
