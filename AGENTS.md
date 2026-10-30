# ferdousbhai.com

Personal site on Cloudflare Workers static assets. Work published here
can be any form (apps, extensions, agentic tools, infographics, video), so pages may use
client-side JavaScript and web fonts. Both are served from this origin: the Content Security
Policy allows scripts and fonts from `'self'` only, so vendor a library or font under `public/`
rather than linking a CDN. Agents read the site through llms.txt and the markdown twins.

Design work follows the skills in `.claude/skills/` (`landing-page-design`,
`redesign-existing-projects`, `design-to-motion`).

## Code index

- `content/index.md` — canonical content and frontmatter. The build reads the `## ` sections in
  order (first is the project list, second is contact), and each entry must be a
  `- [label](url): blurb` line; a blurb ending in a parenthetical such as `(coming soon)` renders
  it as a tag beside the name. Entries in the project list sit under `### ` group headings,
  which become the labels on the page (a swipeable shelf per group on a phone, filter chips
  over one grid on a laptop); entries above any group heading are labelled with the section's
  own heading; a group heading may end in a link, shown beside its label (`### Omarchy [All apps and
  install commands](https://ferdousbhai.com/omarchy)`); the section's heading is the homepage's headline. `{projects}` in any
  frontmatter value is replaced with the project names. A missing section fails the build. Each
  entry is a card in a gallery, showing `public/img/work/<slug>.webp` (slug: the label
  lowercased, runs of other characters as `-`) and, when present, the looping clip `<slug>.mp4`
  with that picture as its poster.
- `content/products.json` — the one catalog of the Omarchy products (id, what it's for, source,
  page, install command). A page line `{install:<id>}` becomes that product's install command and
  `{omarchy-apps}` the list on `/omarchy` (third-party entries are for agents only); the build fails
  when an install command through this site has no `/<slug>/install.sh` line in `_redirects`.
  Ghost's `skills/ghost-products/products.json` is a copy for agents: change this one, then copy
  it there. Its `host` entry is Ghost itself, which that skill's table must skip (Ghost's
  `scripts/ghost-products.ts` doesn't yet).
- `motion/<slug>.html` — a project's clip as a scene: a 1280×800 stage whose `render(t)` sets
  everything from the time alone (helpers in `motion/lib.js`, model in `motion/keep-going.html`).
  `pnpm motion [slug]` records scenes with a headless Chromium into `public/img/work/`; like the
  share cards, the clips are tracked. Scenes hold invented sample content only: never a real
  person, address, file, message or location.
- `content/<slug>.md` — any other file is a page served at `/<slug>` (and `/<slug>.md`), with
  `title` and `description` frontmatter and a body in plain markdown: headings, paragraphs,
  bullet lists, fenced code, images on their own line (PNG or WebP under `public/img/`,
  sized at build time), inline code and links. Blocks are separated by blank lines. A heading
  ending in `{#id}` gets that id, for links to a section.
- `scripts/build.js` — renders all generated public representations: the pages, their markdown
  twins, llms.txt (the homepage markdown plus a page list) and llms-full.txt (every page's
  markdown), robots.txt, sitemap.xml, the stylesheet inlined in every page (and the gallery's,
  on the homepage alone), and `_headers` (cache policy and discovery Link headers per page,
  cache policy for assets), and every page's Open Graph and Twitter tags. `pnpm cards` also
  draws each route's 1200×630 share card (title, description and the page's first screenshot)
  with a headless Chromium into `public/img/og/`. The deploy has no browser, so the cards are
  tracked, and each name carries a hash of what the card shows: after a new page, title,
  description or first screenshot, the build fails until you run `pnpm cards` and commit
  `public/img/og/`.
- `public/favicon.svg`, `public/favicon.ico` (the same sun for Safari, which asks for it by name) and
  `public/img/` (with the drawn share cards in `public/img/og/` and the recorded project
  pictures and clips in `public/img/work/`) and `public/fonts/` (Geist and Geist Mono, OFL) —
  the tracked static assets
- `public/_redirects` — each project's `/<slug>/install.sh` to the install script attached to that project's latest release,
  retired install paths to their replacement's script, and retired page paths to where their content moved
- `src/worker.js` — the only script, run for `/img/work/*.mp4` alone: static assets are served
  without byte ranges, and Safari plays video only from a server that answers a Range request
  with 206, so it slices the clip. Everything else is served by the assets directly.
- `cloudflare.config.ts` — Worker settings (name, compatibility date, the script, which paths run
  it first); `wrangler.config.ts` — asset directory and build command

Generated and gitignored outputs are every `public/*.html` and `public/*.md`, `public/llms.txt`,
`public/llms-full.txt`, `public/robots.txt`, `public/sitemap.xml`, and `public/_headers`. Do not
edit them directly.

## Commands

```sh
pnpm build
pnpm cards   # redraw share cards, then build
pnpm motion  # record project clips from motion/ (or: pnpm motion <slug>)
pnpm dev
```

Production deploys from `main` through Workers Builds; do not run the manual deploy script unless explicitly requested.

## Cloudflare CLI

Use the `cf` CLI for Cloudflare work in this repository: deploys, builds and their
logs, secrets, D1, R2, Tunnels and network routes. Use Wrangler or the dashboard
only where `cf` has no command for the task. Find commands with
`cf cli search "<what you want to do>"`, then check `<command> --help`.
