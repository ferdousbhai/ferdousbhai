# ferdousbhai.com

Small site on Cloudflare Workers static assets: no Worker script, no client-side JavaScript,
no web font, no runtime dependencies. Agents read it through llms.txt and the markdown twins;
there is no WebMCP, as there is no JavaScript to register tools with.

## Code index

- `content/index.md` — canonical content and frontmatter. The build reads the `## ` sections
  in order (first is the project list, second is contact), and each entry must be a
  `- [label](url): blurb` line; a blurb ending in a parenthetical such as `(coming soon)` renders
  it as a tag beside the name. Entries in the project list sit under `### ` group headings,
  which become the labels on the page; entries above any group heading are labelled with
  the section's own heading. `{projects}` in any frontmatter value is
  replaced with the project names. A missing section fails the build.
- `content/<slug>.md` — any other file is a page served at `/<slug>` (and `/<slug>.md`), with
  `title` and `description` frontmatter and a body in plain markdown: headings, paragraphs,
  bullet lists, fenced code, images on their own line (PNG or lossless WebP under `public/img/`,
  sized at build time), inline code and links. Blocks are separated by blank lines. A heading
  ending in `{#id}` gets that id, for links to a section.
- `scripts/build.js` — renders all generated public representations: the pages, their markdown
  twins, llms.txt (the homepage markdown plus a page list) and llms-full.txt (every page's
  markdown), robots.txt, sitemap.xml, the stylesheet inlined in every page, and `_headers`
  (cache policy and discovery Link headers per page, cache policy for assets), and every
  page's Open Graph and Twitter tags. `pnpm cards` also draws each route's 1200×630 share
  card (title, description and the page's first screenshot) with a headless Chromium into
  `public/img/og/`. The deploy has no browser, so the cards are tracked, and each name carries
  a hash of what the card shows: after a new page, title, description or first screenshot,
  the build fails until you run `pnpm cards` and commit `public/img/og/`.
- `public/favicon.svg`, `public/favicon.ico` (the same sun for Safari, which asks for it by name) and
  `public/img/` (with the drawn share cards in `public/img/og/`) — the tracked static assets
- `public/_redirects` — each project's `/<slug>/install.sh` to the install script attached to that project's latest release,
  and retired page paths to where their content moved
- `cloudflare.config.ts` — Worker settings (name, compatibility date); `wrangler.config.ts` — asset directory and build command

Generated and gitignored outputs are every `public/*.html` and `public/*.md`, `public/llms.txt`,
`public/llms-full.txt`, `public/robots.txt`, `public/sitemap.xml`, and `public/_headers`. Do not
edit them directly.

## Commands

```sh
pnpm build
pnpm cards   # redraw share cards, then build
pnpm dev
```

Production deploys from `main` through Workers Builds; do not run the manual deploy script unless explicitly requested.

## Cloudflare CLI

Use the `cf` CLI for Cloudflare work in this repository: deploys, builds and their
logs, secrets, D1, R2, Tunnels and network routes. Use Wrangler or the dashboard
only where `cf` has no command for the task. Find commands with
`cf cli search "<what you want to do>"`, then check `<command> --help`.
