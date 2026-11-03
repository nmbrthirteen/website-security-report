# Website security report

An agent skill that reads a site's code and renders a PDF of the security
controls it enforces, with every number traced to a line of code.

![Sample report](./examples/preview.png)

## Install

```bash
npx skills add nmbrthirteen/website-security-report
```

Or clone it into `~/.claude/skills/website-security-report`.

Then ask for a security overview, or run `/website-security-report`. Needs
Node 18+ and Chrome.

MIT license.
