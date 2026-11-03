# Report format

## Contents

- Top-level fields and theme
- Section kinds: `flow`, `table`, `facts`, `steps`, `list`
- Inline marks
- Fitting pages

One JSON file per site. `scripts/build.mjs` validates it before rendering and names the field that is wrong.

```json
{
  "title": "example.com security overview",
  "theme": {
    "ink": "#111214",
    "fontFamily": "Brand Sans",
    "fonts": [
      { "family": "Brand Sans", "weight": 400, "file": "../public/fonts/brand-400.woff2" },
      { "family": "Brand Sans", "weight": 600, "file": "../public/fonts/brand-600.woff2" }
    ]
  },
  "sections": []
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | Yes | Names the site, like `example.com security overview` |
| `theme.ink` | No | Headings, rules and guard boxes. The site's darkest brand color, default `#111214` |
| `theme.fontFamily` | No | The site's own text face, only when the site already serves it publicly |
| `theme.fonts` | No | Font files, paths relative to the JSON file. `woff2`, `woff` or `ttf`. Use weights 400, 500 and 600 |

Without fonts the report uses the system sans serif.

## Section kinds

Every section has a `title` and a `kind`. Sections render in the order given.

### `flow`

Columns from left to right, joined by arrows. A column holds one node or a few stacked ones. Mark the parts that enforce the controls in this report with `"tone": "guard"`.

```json
{
  "kind": "flow",
  "title": "Request flow",
  "columns": [
    ["Visitor"],
    ["Cloudflare", "Load balancer"],
    [{ "label": "App guard", "tone": "guard" }],
    ["PostgreSQL 16", "Object storage"]
  ]
}
```

Keep labels short enough to fit one line. Two to five columns, up to three nodes per column.

### `table`

```json
{
  "kind": "table",
  "title": "Rate limits",
  "columns": ["Traffic", "Limit", "Counter", "Over limit"],
  "rows": [
    ["API", "300 / min", "Per IP, shared", "429"],
    ["Sign-in", "10 / 15 min", "Per IP, per instance", "**Blocked**"]
  ]
}
```

Every row has one string per column. Leave a cell empty with `""`.

### `facts`

Label and value pairs in two columns. Best for short settings.

```json
{
  "kind": "facts",
  "title": "Sign-in and admin access",
  "items": [
    { "label": "Two-factor", "value": "Every account" },
    { "label": "Session", "value": "8 hours" }
  ]
}
```

Use an even number of items so both columns end on the same line. Keep values under about 30 characters. A control that needs a longer value belongs in a `table`.

### `steps`

A short sequence joined by arrows, like escalating block lengths.

```json
{ "kind": "steps", "title": "Block length", "steps": ["1 h", "4 h", "16 h", "30 d"] }
```

### `list`

Plain bullets. Use it for Known limits only.

```json
{
  "kind": "list",
  "title": "Known limits",
  "items": ["Rate counters are per instance. Two instances double the effective limit."]
}
```

## Inline marks

Inside any string, `**bold**` sets weight and `` `code` `` sets monospace. Use bold for the harshest outcome in a column, like `**Blocked**`. Use code only for a literal header value a reviewer would search for, like `nosniff`. Header names stay plain text.

## Fitting pages

Sections never split across pages. A section that does not fit moves whole to the next page, which can leave space at the bottom of the one before.

- A last page with one section alone: drop rows that carry the least, or move a short section earlier.
- A gap at the bottom of a page: move a smaller section into it, or merge two small `facts` sections.
- Tables over about 25 rows will not fit with others on a page. Split them by topic.
