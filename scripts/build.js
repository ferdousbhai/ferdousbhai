import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const contentDir = repositoryRoot + "content/";
const publicDir = repositoryRoot + "public/";
const SITE_URL = "https://ferdousbhai.com";
// The browser chrome and the page paint the same colour; keep it said once.
const BG = "#13111a";

// content/index.md is the homepage; every other content/<slug>.md is a page
// served at /<slug>, rendered from plain markdown.
const readContent = (file) => {
  const source = readFileSync(contentDir + file, "utf8");
  const [, frontmatter, markdownBody] = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = Object.fromEntries(
    frontmatter.split("\n").map((line) => {
      const separatorIndex = line.indexOf(":");
      return [line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()];
    }),
  );
  return { meta, markdown: markdownBody.trim() + "\n" };
};

const { meta, markdown } = readContent("index.md");
const pages = readdirSync(contentDir)
  .filter((file) => file.endsWith(".md") && file !== "index.md")
  .map((file) => ({ path: `/${file.slice(0, -3)}`, ...readContent(file) }));

// One grammar for a markdown link, in its three places: a list entry, a link
// in running text, and an image on its own line.
const LINK = String.raw`\[([^\]]*)\]\(([^)]+)\)`;
const ENTRY = new RegExp(String.raw`^- (?:.+?: )?${LINK}(?:: (.+))?$`, "gm");
const INLINE_LINK = new RegExp(LINK, "g");
const IMAGE = new RegExp(String.raw`^!${LINK}$`);

// The Contact lines carry a "Email: " / "GitHub: " prefix that reads well in
// the markdown but says nothing the link does not; the page drops it. A blurb
// may end in a parenthetical such as "(coming soon)"; the page shows that as a
// tag beside the name instead of in the blurb.
const parseLinks = (text) =>
  [...text.matchAll(ENTRY)].map(([, label, url, blurb = ""]) => {
    const [, text, tag] = blurb.match(/^(.*?)(?: \(([^()]+)\))?$/);
    return { label, url, blurb: text, tag };
  });

// Sections are positional, the first being the projects and the second the
// contact, so their headings are free text. Links are grouped under `### `
// headings; links above the first one form a group labelled with the section's
// own heading. Too few sections throws at the first use of the missing one.
const parseGroup = (text) => ({ heading: text.slice(0, text.indexOf("\n")).trim(), links: parseLinks(text) });
const sections = markdown
  .split(/^## /m)
  .slice(1)
  .map((section) => {
    const groups = section
      .split(/^### /m)
      .map(parseGroup)
      .filter((group) => group.links.length > 0);
    return { groups, links: groups.flatMap((group) => group.links) };
  });

const [work, contact] = sections;

// The description and summary named the same projects the list does, so a rename
// meant three edits in one file. They write {projects} and get it filled in here.
const projectList = new Intl.ListFormat("en").format(work.links.map(({ label }) => label));
for (const [key, value] of Object.entries(meta)) {
  meta[key] = value.replaceAll("{projects}", projectList);
}

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const escapeHtml = (value) => value.replace(/[&<>"]/g, (character) => HTML_ESCAPES[character]);

const projectHtml = ({ label, url, blurb, tag }) => {
  const blurbHtml = blurb ? `\n          <p class="work__blurb">${escapeHtml(blurb)}</p>` : "";
  const tagHtml = tag ? ` <span class="work__tag">${escapeHtml(tag)}</span>` : "";
  return `      <li>
        <a class="work__link" href="${escapeHtml(url)}">
          <span class="work__name">${escapeHtml(label)}</span>${tagHtml}${blurbHtml}
        </a>
      </li>`;
};

// Each group is its label and its entries; the label is the group's heading.
const projectGroupsHtml = work.groups
  .map(
    ({ heading, links }) => `      <section class="group">
      <h2 class="group__label">${escapeHtml(heading)}</h2>
      <ul class="work">
${links.map(projectHtml).join("\n")}
      </ul>
      </section>`,
  )
  .join("\n");

const contactLinksHtml = contact.links
  .map(({ url, label }) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`)
  .join("\n      ");

const personJsonLd = JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: meta.name,
    url: SITE_URL,
    email: contact.links.find(({ url }) => url.startsWith("mailto:"))?.url.slice("mailto:".length),
    sameAs: contact.links.filter(({ url }) => !url.startsWith("mailto:")).map(({ url }) => url),
  },
).replace(/</g, "\\u003c");

const inlineHtml = (text) =>
  escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(INLINE_LINK, '<a href="$2">$1</a>');

// An image is written with its size so the text below it stays put while it
// arrives. Only the two formats the site keeps are read: PNG, and the lossless
// WebP a screenshot shrinks to at no cost to the pixels.
const imageSize = (src) => {
  const bytes = readFileSync(publicDir + src.slice(1));
  if (bytes.toString("latin1", 1, 4) === "PNG") return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (bytes.toString("latin1", 12, 16) === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  throw new Error(`${src} is not a PNG or a lossless WebP`);
};

// The subset of markdown the pages use: headings, paragraphs, bullet lists,
// fenced code, an image on its own line, and inline code and links. Blocks are
// separated by blank lines; anything unrecognised is a paragraph.
const renderMarkdown = (source) => {
  const lines = source.split("\n");
  const html = [];
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const code = [];
      for (i += 1; i < lines.length && !lines[i].startsWith("```"); i += 1) code.push(lines[i]);
      i += 1;
      html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    } else if (/^#{1,6} /.test(line)) {
      const level = line.indexOf(" ");
      // A trailing `{#id}` gives the heading an anchor to link to.
      const [, text, id] = line.slice(level + 1).match(/^(.*?)(?:\s+\{#([a-z0-9-]+)\})?$/);
      html.push(`<h${level}${id ? ` id="${id}"` : ""}>${inlineHtml(text)}</h${level}>`);
      i += 1;
    } else if (line.startsWith("![")) {
      const [, alt, src] = line.match(IMAGE);
      const { width, height } = imageSize(src);
      html.push(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="${width}" height="${height}">`);
      i += 1;
    } else if (line.startsWith("- ")) {
      const items = [];
      for (; i < lines.length && lines[i].startsWith("- "); i += 1) items.push(`  <li>${inlineHtml(lines[i].slice(2))}</li>`);
      html.push(`<ul>\n${items.join("\n")}\n</ul>`);
    } else if (line.trim() === "") {
      i += 1;
    } else {
      const text = [];
      for (; i < lines.length && lines[i].trim() !== ""; i += 1) text.push(lines[i]);
      html.push(`<p>${inlineHtml(text.join(" "))}</p>`);
    }
  }
  return html.join("\n");
};

// Comments and indentation stay here; the page gets the rules alone.
const stylesheet = `
/* One flat ink background, one raised surface for panels and code, one hairline.
   Two levels of text: --ink for names and prose, --dim for everything quieter,
   kept readable at the micro size. Color is spent sparingly: the sun in the
   accent, and each project group's own hue on its label and its hovers. */
:root {
  color-scheme: dark;
  --bg: ${BG};
  --surface: #1c1826;
  --line: #2e2840;
  --ink: #f2eef8;
  --dim: #aea5c0;
  --accent: #f4c26b;
  --hue: var(--accent);
  --micro: 0.75rem;
  /* The reader's own monospace: no font request, nothing to swap in later. */
  --mono: ui-monospace, "JetBrains Mono", "Cascadia Mono", "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100svh;
  display: flex;
  justify-content: center;
  padding: clamp(0.5rem, 1.8vw, 1.1rem);
  background: var(--bg);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 0.875rem;
  line-height: 1.6;
}
::selection { background: var(--accent); color: var(--bg); }
a { color: inherit; text-decoration: none; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }

.frame {
  flex: 1;
  max-width: 64rem;
  display: flex;
  flex-direction: column;
}

.bar, .stage, .foot { padding-inline: clamp(1rem, 3.5vw, 2.75rem); }
.bar, .foot {
  display: flex;
  align-items: center;
  padding-block: clamp(0.9rem, 2.4vh, 1.4rem);
}
/* Everything small on the site is the one micro size, and every label among
   them is set the same way. */
.bar, .foot, .group__label, .doc h2, .work__tag { font-size: var(--micro); }
.bar, .group__label, .doc h2, .work__tag {
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.bar {
  justify-content: space-between;
  gap: 1rem;
}
/* The name follows a small sun like the favicon's. */
.bar__name {
  margin: 0;
  font-size: inherit;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.75em;
}
.bar__name::before {
  content: "";
  flex: none;
  width: 0.7em;
  height: 0.7em;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
}
a.bar__name:hover { color: var(--accent); }
.bar__page {
  color: var(--dim);
  text-align: right;
}

.stage {
  flex: 1;
  display: grid;
  align-content: center;
  row-gap: clamp(0.9rem, 2vh, 1.25rem);
  padding-block: clamp(0.5rem, 1.4vh, 1rem);
}
.stage:has(> .doc) { align-content: start; }

/* Each collection is a quiet panel; its hue shows only on the label's dot,
   the tags, and a name on hover. */
.group {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: clamp(1rem, 2.2vh, 1.4rem) clamp(1rem, 2.6vw, 1.6rem);
}
.group:nth-child(4n + 1) { --hue: #7fdcb4; }
.group:nth-child(4n + 2) { --hue: #9fb0ff; }
.group:nth-child(4n + 3) { --hue: #ff9fcd; }
.group:nth-child(4n + 4) { --hue: #ffbd7a; }
.group__label {
  display: flex;
  align-items: center;
  gap: 0.6em;
  margin: 0 0 1rem;
  color: var(--dim);
  font-weight: 600;
}
.group__label::before {
  content: "";
  width: 0.55em;
  height: 0.55em;
  border-radius: 50%;
  background: var(--hue);
}

/* Stacked, the entries would run past the fold on a laptop, so they pair up and
   the list is half as many rows deep. */
.work {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(1.25rem, 3.5vw, 3rem);
  row-gap: clamp(0.9rem, 2vh, 1.4rem);
}
.work__link { display: block; }
/* An entry's name and a page's title are the two title sizes, set alike. */
.work__name, .doc h1, .card h1 {
  font-weight: 700;
  letter-spacing: -0.02em;
}
.work__name { font-size: clamp(0.9375rem, min(2vw, 2.5vh), 1.125rem); }
/* On hover the name takes its group's hue and an arrow slides in. */
.work__name::after {
  content: " →";
  display: inline-block;
  opacity: 0;
  transform: translateX(-0.3em);
}
.work__link:hover .work__name,
.work__link:focus-visible .work__name { color: var(--hue); }
.work__link:hover .work__name::after,
.work__link:focus-visible .work__name::after { opacity: 1; transform: none; }
.work__tag {
  margin-left: 0.5rem;
  padding: 0.05rem 0.5rem;
  border: 1px solid color-mix(in srgb, var(--hue) 45%, transparent);
  border-radius: 999px;
  color: var(--hue);
  font-size: 0.6875rem;
  vertical-align: 0.15em;
}
.work__blurb {
  margin: 0.2rem 0 0;
  color: var(--dim);
  max-width: 34rem;
}

/* A page: one column of prose in the same frame. */
.doc { max-width: 40rem; padding-top: clamp(0.5rem, 2vh, 1.5rem); }
.doc h1 {
  margin: 0 0 1rem;
  font-size: clamp(1.375rem, 3.2vw, 1.875rem);
  line-height: 1.2;
}
.doc h2 {
  margin: 2.25rem 0 0.6rem;
  color: var(--accent);
  font-weight: 700;
}
.doc p, .doc ul { margin: 0 0 0.85rem; }
.doc ul { padding-left: 1.25rem; }
.doc li { margin-bottom: 0.3rem; }
.doc li::marker { content: "– "; color: var(--dim); }
.doc a {
  color: var(--accent);
  text-decoration: underline 1px color-mix(in srgb, var(--accent) 40%, transparent);
  text-underline-offset: 0.25em;
}
.doc a:hover { text-decoration-color: var(--accent); }
/* Inline code wraps mid-phrase, and a border would split with it; the shade
   alone marks it. */
.doc code {
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: var(--surface);
  color: var(--ink);
}
.doc pre, .doc img {
  border: 1px solid var(--line);
  border-radius: 10px;
}
/* A long command scrolls inside its box. Containment keeps the block's width
   out of its ancestors' minimum size, so nothing above it widens past a phone. */
.doc pre {
  margin: 0.6rem 0 1rem;
  padding: 0.85rem 1rem;
  background: var(--surface);
  overflow-x: auto;
  contain: inline-size;
}
.doc pre code { padding: 0; background: none; }
.doc img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0.4rem 0 1.1rem;
}

.foot {
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  letter-spacing: 0.03em;
  color: var(--dim);
}
.foot a:hover { color: var(--accent); }

/* Movement only for readers who have not asked for less of it. */
@media (prefers-reduced-motion: no-preference) {
  .work__name, .work__name::after, .foot a, .bar__name, .doc a {
    transition: color 0.15s ease, opacity 0.15s ease, transform 0.15s ease, text-decoration-color 0.15s ease;
  }
}

@media (max-width: 56rem) {
  .work { grid-template-columns: minmax(0, 1fr); }
}

/* On a phone the entries stack and the page scrolls; the type stays the size
   it is on a desktop rather than shrinking to fit one screen. */
@media (max-width: 40rem) {
  body { padding: 0.4rem; }
  /* One contact per line: whole-line tap targets instead of a ragged wrap. */
  .foot { flex-direction: column; align-items: flex-start; gap: 0.6rem; }
}
`
  .replace(/\s*\/\*[\s\S]*?\*\//g, "")
  .replace(/\n\s*/g, "\n");

// Every route has a file stem: "/" is index, "/<slug>" is <slug>. The stem names
// the html and markdown files and so the markdown twin's path.
const stem = (path) => (path === "/" ? "index" : path.slice(1));
const markdownPath = (path) => `/${stem(path)}.md`;

// One shell for every page: the same head, frame, bar and footer, so a page
// and the homepage differ only in what the stage holds. The name in the bar is
// the homepage's h1; on a page it is a link home and the page's own title is the h1.
// A page is told apart from the homepage by having a title of its own.
const shell = ({ pageTitle, description, path, stageHtml, jsonLd, card }) => `<!doctype html>
<html lang="en" translate="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pageTitle ? `${pageTitle} — ${meta.name}` : meta.name)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="${BG}">
<link rel="canonical" href="${SITE_URL}${path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtml(meta.name)}">
<meta property="og:title" content="${escapeHtml(pageTitle ?? meta.name)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${SITE_URL}${path}">
<meta property="og:image" content="${SITE_URL}${card.src}">
<meta property="og:image:width" content="${CARD.width}">
<meta property="og:image:height" content="${CARD.height}">
<meta property="og:image:alt" content="${escapeHtml(card.alt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate" type="text/markdown" href="${markdownPath(path)}">
<style>${stylesheet}</style>${jsonLd ? `\n<script type="application/ld+json">\n${jsonLd}\n</script>` : ""}
</head>
<body>
  <div class="frame">
    <header class="bar">
      ${pageTitle ? `<a class="bar__name" href="/">${escapeHtml(meta.title)}</a>
      <span class="bar__page">${escapeHtml(pageTitle)}</span>` : `<h1 class="bar__name">${escapeHtml(meta.title)}</h1>`}
    </header>

    <main class="stage">
${stageHtml}
    </main>

    <footer class="foot">
      ${contactLinksHtml}
    </footer>
  </div>
</body>
</html>
`;

const routes = [
  {
    path: "/",
    description: meta.description,
    jsonLd: personJsonLd,
    stageHtml: projectGroupsHtml,
    markdown,
  },
  ...pages.map(({ path, meta: pageMeta, markdown: pageMarkdown }) => ({
    path,
    pageTitle: pageMeta.title,
    description: pageMeta.description,
    stageHtml: `      <article class="doc">\n${renderMarkdown(pageMarkdown)}\n      </article>`,
    markdown: pageMarkdown,
  })),
];

// Every route has a share card, the image a link preview shows: the page's
// title and description in the site's own frame, over the page's first
// screenshot if it has one. Cards are drawn by `pnpm cards` with a headless
// Chromium and tracked under public/img/og/, since the deploy builds without a
// browser. A card's name carries a hash of everything drawn on it, so a new
// title, description or screenshot asks for a new card: the build fails until
// one is drawn, and a platform that caches previews by URL fetches the new one.
const CARD = { width: 1200, height: 630 };
const cardDir = publicDir + "img/og/";
const cardStylesheet = `
html, body { width: ${CARD.width}px; height: ${CARD.height}px; overflow: hidden; }
body { padding: 20px; font-size: 26px; }
.frame { max-width: none; overflow: hidden; }
.bar { font-size: 17px; padding: 22px 44px 0; }
.card { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 30px 44px 0; }
.card h1 { margin: 0; font-size: 68px; line-height: 1.1; }
.card p {
  margin: 18px 0 0;
  color: var(--dim);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--lines);
  overflow: hidden;
}
.card img {
  flex: 1;
  min-height: 0;
  width: 100%;
  margin-top: 34px;
  object-fit: cover;
  object-position: top left;
  border: 1px solid var(--line);
  border-bottom: 0;
  border-radius: 6px 6px 0 0;
}
.card:not(:has(img)) { justify-content: center; padding-bottom: 60px; }
`;

const cardHtml = ({ path, pageTitle, description, image }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>${stylesheet}${cardStylesheet}</style>
</head>
<body>
  <div class="frame">
    <header class="bar">
      <span class="bar__name">${escapeHtml(meta.title)}</span>
      <span class="bar__page">${escapeHtml(`ferdousbhai.com${path === "/" ? "" : path}`)}</span>
    </header>
    <main class="card" style="--lines: ${image ? 2 : 4}">
      <h1>${escapeHtml(pageTitle ?? meta.name)}</h1>
      <p>${escapeHtml(description)}</p>${image ? `\n      <img src="${escapeHtml(image.src)}" alt="">` : ""}
    </main>
  </div>
</body>
</html>
`;

for (const route of routes) {
  const [, alt, src] = route.markdown.match(new RegExp(IMAGE.source, "m")) ?? [];
  route.image = src && { src, alt };
  const html = cardHtml(route);
  const hash = createHash("sha256").update(html);
  if (src) hash.update(readFileSync(publicDir + src.slice(1)));
  const file = `${stem(route.path)}-${hash.digest("hex").slice(0, 10)}.png`;
  route.card = {
    src: `/img/og/${file}`,
    alt: `${route.pageTitle ?? meta.name}: ${route.description}`,
    file,
    html,
  };
}

if (process.argv.includes("--cards")) {
  mkdirSync(cardDir, { recursive: true });
  const workDir = tmpdir() + "/ferdousbhai-cards/";
  mkdirSync(workDir, { recursive: true });
  const cardFiles = new Set(routes.map(({ card }) => card.file));
  for (const file of readdirSync(cardDir)) {
    if (!cardFiles.has(file)) rmSync(cardDir + file);
  }
  for (const { path, card } of routes) {
    if (existsSync(cardDir + card.file)) continue;
    // The card names its screenshot from the site root, and is hashed that way;
    // only the copy Chromium opens points into public/ on this machine.
    const source = `${workDir}${stem(path)}.html`;
    writeFileSync(source, card.html.replace(' src="/', ` src="file://${publicDir}`));
    const { status, stderr } = spawnSync(process.env.CHROMIUM ?? "chromium", [
      "--headless",
      `--user-data-dir=${workDir}chromium-profile`,
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${CARD.width},${CARD.height}`,
      `--screenshot=${cardDir}${card.file}`,
      `file://${source}`,
    ], {
      // A profile of its own, and none of the user's chromium-flags.conf (the launcher reads it
      // from XDG_CONFIG_HOME): an open browser's profile or debugging port would stop this run.
      env: { ...process.env, XDG_CONFIG_HOME: workDir },
      timeout: 60_000,
    });
    if (status !== 0) throw new Error(`Chromium could not draw ${card.file}:\n${stderr}`);
    console.log(`drew public/img/og/${card.file}`);
  }
}

const staleCards = routes.filter(({ card }) => !existsSync(cardDir + card.file));
if (staleCards.length > 0) {
  throw new Error(
    `No share card for ${staleCards.map(({ path }) => path).join(", ")}: run \`pnpm cards\` and commit public/img/og/.`,
  );
}

const pageLinks = pages
  .map(({ path, meta: pageMeta }) => `- [${pageMeta.title}](${SITE_URL}${markdownPath(path)}): ${pageMeta.description}`)
  .join("\n");
// llms.txt is the homepage markdown with the summary and a pointer slipped in
// after its heading line, and the pages listed at the end.
const llmsIndex =
  markdown.replace(
    "\n",
    `\n\n> ${meta.summary}\n\nFull version in markdown: [index.md](${SITE_URL}${markdownPath("/")}); every page in one file: [llms-full.txt](${SITE_URL}/llms-full.txt).\n`,
  ) + `\n## Pages\n\n${pageLinks}\n`;

const sitemapUrls = routes
  .map(({ path }) => `  <url>\n    <loc>${SITE_URL}${path}</loc>\n  </url>`)
  .join("\n");

// Every route: a held copy is handed over while it revalidates, so a repeat
// visit paints at once, and the Link header points agents at the markdown twin
// and llms.txt (crawlers find the sitemap through robots.txt). Assets under
// /img are screenshots; a week is long enough to keep them and short enough
// to replace one.
const routeHeaders = routes
  .map(
    ({ path }) => `${path}
  Cache-Control: public, max-age=0, stale-while-revalidate=86400
  Link: <${markdownPath(path)}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="llms-txt"`,
  )
  .join("\n\n");

const generatedFiles = {
  "_headers": `${routeHeaders}

/favicon.svg
  Cache-Control: public, max-age=604800

/favicon.ico
  Cache-Control: public, max-age=604800

/img/*
  Cache-Control: public, max-age=604800
`,
  "robots.txt": `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`,
  "sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}
</urlset>
`,
  "llms-full.txt": routes.map((route) => route.markdown).join("\n---\n\n"),
  "llms.txt": llmsIndex,
};

for (const route of routes) {
  generatedFiles[`${stem(route.path)}.html`] = shell(route);
  generatedFiles[`${stem(route.path)}.md`] = route.markdown;
}

for (const [name, content] of Object.entries(generatedFiles)) {
  writeFileSync(publicDir + name, content);
  console.log(`wrote public/${name} (${Buffer.byteLength(content)} bytes)`);
}
