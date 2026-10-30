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
const BG = "#000000";

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

// content/products.json is the one catalog of the Omarchy products: what each is for and how to
// install it (Ghost's ghost-products skill keeps a copy for agents; see AGENTS.md). On a page, a
// line `{install:<id>}` becomes that product's install command, and `{omarchy-apps}` the whole
// list (in the catalog's order; third-party ones are for agents only), in the html and the
// markdown twin alike.
const products = JSON.parse(readFileSync(contentDir + "products.json", "utf8")).products;
const installBlock = (id) => {
  const install = products.find((entry) => entry.id === id)?.install;
  if (!install) throw new Error(`content/products.json has no install command for "${id}"`);
  return "```sh\n" + install + "\n```";
};
// A note starts lowercase, to follow the command in Ghost's table; here it is its own sentence.
const sentence = (text) => text[0].toUpperCase() + text.slice(1) + ".";
const appsMarkdown = products
  .filter((entry) => !entry.third_party)
  .map((entry) => {
    const name = entry.site ? `[${entry.name}](${entry.site})` : entry.name;
    const note = entry.note ? `\n\n${sentence(entry.note)}` : "";
    return `## ${name} {#${entry.id}}\n\n${entry.need}. [Source](${entry.source})\n\n${installBlock(entry.id)}${note}`;
  })
  .join("\n\n");
const expandProducts = (markdownText) =>
  markdownText
    .replace(/^\{install:([a-z0-9-]+)\}$/gm, (_, id) => installBlock(id))
    .replace(/^\{omarchy-apps\}$/gm, () => appsMarkdown);

const { meta, markdown } = readContent("index.md");
const pages = readdirSync(contentDir)
  .filter((file) => file.endsWith(".md") && file !== "index.md")
  .map((file) => {
    const page = readContent(file);
    return { path: `/${file.slice(0, -3)}`, ...page, markdown: expandProducts(page.markdown) };
  });

// Every install command through this site needs its redirect to the release's script.
const redirects = readFileSync(publicDir + "_redirects", "utf8");
for (const { id, install = "" } of products) {
  const [, slug] = install.match(/https:\/\/ferdousbhai\.com\/([a-z0-9-]+)\/install\.sh/) ?? [];
  if (slug && !redirects.includes(`\n/${slug}/install.sh `))
    throw new Error(`${id} installs from /${slug}/install.sh, which public/_redirects does not redirect`);
}

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
// contact, so their headings are free text; the projects' heading is the
// homepage's headline. Links are grouped under `### ` headings; links above the
// first one form a group labelled with the section's own heading. A group
// heading may end in a link, shown beside the label (`### Omarchy [All apps](https://ferdousbhai.com/omarchy)`).
// Too few sections throws at the first use of the missing one.
const firstLine = (text) => text.slice(0, text.indexOf("\n")).trim();
const slugOf = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const GROUP_HEADING = new RegExp(String.raw`^(.*?)(?:\s+${LINK})?$`);
const parseGroup = (text) => {
  const [, heading, moreLabel, moreUrl] = firstLine(text).match(GROUP_HEADING);
  return { heading, slug: slugOf(heading), more: moreUrl && { label: moreLabel, url: moreUrl }, links: parseLinks(text) };
};
const sections = markdown
  .split(/^## /m)
  .slice(1)
  .map((section) => {
    const groups = section
      .split(/^### /m)
      .map(parseGroup)
      .filter((group) => group.links.length > 0);
    return { heading: firstLine(section), groups, links: groups.flatMap((group) => group.links) };
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

// An image is written with its size so the text below it stays put while it
// arrives. Only the formats the site keeps are read: PNG, the lossless WebP a
// screenshot shrinks to at no cost to the pixels, and the lossy WebP of a
// clip's poster.
const imageSize = (src) => {
  const bytes = readFileSync(publicDir + src.slice(1));
  if (bytes.toString("latin1", 1, 4) === "PNG") return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (bytes.toString("latin1", 12, 16) === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (bytes.toString("latin1", 12, 16) === "VP8 ") {
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  throw new Error(`${src} is not a PNG or a WebP`);
};

// A project's picture is found by its name: public/img/work/<slug>.webp, and
// beside it <slug>.mp4 when the project has a clip (drawn from motion/<slug>.html
// by `pnpm motion`). The clip loops silently; the picture is its poster, and
// stands in for it for readers who ask for less motion.
const mediaHtml = (label) => {
  const base = `/img/work/${slugOf(label)}`;
  const hasClip = existsSync(`${publicDir}${base.slice(1)}.mp4`);
  if (!existsSync(`${publicDir}${base.slice(1)}.webp`)) {
    if (hasClip) throw new Error(`${base}.mp4 has no poster: add ${base}.webp`);
    return "";
  }
  const { width, height } = imageSize(`${base}.webp`);
  const size = `width="${width}" height="${height}"`;
  const clip = hasClip
    ? `<video src="${base}.mp4" poster="${base}.webp" ${size} autoplay muted loop playsinline aria-hidden="true"></video>`
    : "";
  return `\n          <span class="work__media${hasClip ? " work__media--clip" : ""}">${clip}<img src="${base}.webp" alt="" ${size} loading="lazy"></span>`;
};

const projectHtml = ({ label, url, blurb, tag }) => {
  const blurbHtml = blurb ? `\n            <span class="work__blurb">${escapeHtml(blurb)}</span>` : "";
  const tagHtml = tag ? ` <span class="work__tag">${escapeHtml(tag)}</span>` : "";
  return `      <li>
        <a class="work__link" href="${escapeHtml(url)}">${mediaHtml(label)}
          <span class="work__text">
            <span class="work__name">${escapeHtml(label)}</span>${tagHtml}${blurbHtml}
          </span>
        </a>
      </li>`;
};

// The headline, a row of chips that filter the gallery to one group, then each
// group as its label and its entries; the label is the group's heading. The
// chips are radio buttons, so the filtering needs no script.
const chipHtml = (value, label, checked = false) =>
  `        <label class="chip"><input type="radio" name="group" value="${value}"${checked ? " checked" : ""}><span>${escapeHtml(label)}</span></label>`;
const projectGroupsHtml = `      <h1 class="headline">${escapeHtml(work.heading)}</h1>
      <div class="chips" role="radiogroup" aria-label="Show">
${[chipHtml("all", "All", true), ...work.groups.map(({ heading, slug }) => chipHtml(slug, heading))].join("\n")}
      </div>
      <div class="gallery">
${work.groups
  .map(
    ({ heading, slug, more, links }) => `      <section class="group" data-group="${slug}">
      <h2 class="group__label">${escapeHtml(heading)}</h2>${more ? `<a class="group__more" href="${escapeHtml(more.url)}">${escapeHtml(more.label)}&nbsp;→</a>` : ""}
      <ul class="work">
${links.map(projectHtml).join("\n")}
      </ul>
      </section>`,
  )
  .join("\n")}
      </div>`;
// A checked chip hides every group but its own.
const chipStylesheet = work.groups
  .map(({ slug }) => `.stage:has(.chip input[value="${slug}"]:checked) .group:not([data-group="${slug}"]) { display: none; }`)
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

const minifyCss = (css) => css.replace(/\s*\/\*[\s\S]*?\*\//g, "").replace(/\n\s*/g, "\n");

// Comments and indentation stay here; the page gets the rules alone.
const stylesheet = minifyCss(`
/* Geist for everything, Geist Mono for code and tags; both served from here
   (public/fonts, under the OFL), as the CSP takes fonts from this origin only. */
@font-face {
  font-family: "Geist";
  src: url("/fonts/Geist-Variable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "Geist Mono";
  src: url("/fonts/GeistMono-Variable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
/* Flat black, one raised surface for panels and code, one hairline. Two levels
   of text: --ink for names and prose, --dim for everything quieter. Gold is the
   one accent: the sun, hovers, links and tags. Sizes come from Tailwind's type
   scale and spacing from 2, 4, 8, 12, 16, 24, 32, 40, 48, 64px. */
:root {
  color-scheme: dark;
  --bg: ${BG};
  --surface: #181818;
  --line: #272727;
  --ink: #f5f5f5;
  --dim: #9b9b9b;
  --accent: #f4c26b;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100svh;
  display: flex;
  justify-content: center;
  padding: 8px;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 1rem;
  line-height: 1.5rem;
  -webkit-font-smoothing: antialiased;
}
::selection { background: var(--accent); color: var(--bg); }
a { color: inherit; text-decoration: none; }
:focus-visible, .chip input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 4px; }
h1, h2 { text-wrap: balance; }
p { text-wrap: pretty; }

.frame {
  --gutter: 16px;
  flex: 1;
  max-width: 64rem;
  display: flex;
  flex-direction: column;
}

.bar, .stage, .foot { padding-inline: var(--gutter); }
.bar, .foot {
  display: flex;
  align-items: center;
  padding-block: 24px;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.bar {
  justify-content: space-between;
  gap: 16px;
}
/* The name follows a small sun like the favicon's. */
.bar__name {
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.bar__name::before {
  content: "";
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent);
}
a.bar__name:hover { color: var(--accent); }
.bar__page {
  color: var(--dim);
  text-align: right;
}

.stage {
  flex: 1;
  display: grid;
  align-content: start;
  grid-template-columns: minmax(0, 1fr);
  row-gap: 16px;
  padding-block: 16px 48px;
}
.headline {
  margin: 0 0 16px;
  max-width: 680px;
  font-size: 2.25rem;
  line-height: 2.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}

/* A page: one column of prose in the same frame. */
.doc { max-width: 40rem; padding-top: 16px; }
.doc h1 {
  margin: 0 0 24px;
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}
.doc h2 {
  margin: 48px 0 12px;
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.doc p, .doc ul { margin: 0 0 16px; }
.doc ul { padding-left: 24px; }
.doc li { margin-bottom: 4px; }
.doc li::marker { content: "– "; color: var(--dim); }
.doc a {
  color: var(--accent);
  text-decoration: underline 1px color-mix(in srgb, var(--accent) 40%, transparent);
  text-underline-offset: 4px;
}
.doc a:hover { text-decoration-color: var(--accent); }
/* Inline code wraps mid-phrase, and a border would split with it; the shade
   alone marks it. */
.doc code {
  padding: 2px 4px;
  border-radius: 4px;
  background: var(--surface);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 0.875em;
}
.doc pre, .doc img {
  border: 1px solid var(--line);
  border-radius: 12px;
}
/* A long command scrolls inside its box. Containment keeps the block's width
   out of its ancestors' minimum size, so nothing above it widens past a phone. */
.doc pre {
  margin: 8px 0 16px;
  padding: 16px;
  background: var(--surface);
  overflow-x: auto;
  contain: inline-size;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.doc pre code { padding: 0; background: none; font-size: inherit; }
.doc img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 8px 0 24px;
}

.foot {
  flex-wrap: wrap;
  gap: 8px 24px;
  color: var(--dim);
}
.foot a:hover { color: var(--accent); }

/* Movement only for readers who have not asked for less of it. */
@media (prefers-reduced-motion: no-preference) {
  .work__link, .work__name, .work__name::after, .foot a, .group__more, .bar__name, .doc a, .chip span {
    transition: color 300ms var(--ease), background-color 300ms var(--ease), opacity 300ms var(--ease), transform 300ms var(--ease), text-decoration-color 300ms var(--ease);
  }
}
@media (min-width: 40rem) {
  body { padding: 16px; }
  .frame { --gutter: 40px; }
  .headline { font-size: 3rem; line-height: 1; }
  .doc h1 { font-size: 2.25rem; line-height: 2.5rem; }
}

/* On a phone, one contact per line: whole-line tap targets instead of a
   ragged wrap. */
@media (max-width: 40rem) {
  .foot { flex-direction: column; align-items: flex-start; gap: 12px; }
}
`);

// The homepage's gallery, inlined on the homepage alone: the other pages and the
// share cards never show it, so its styles stay out of their bytes and out of
// the cards' hashes.
const galleryStylesheet = minifyCss(`
.group__label {
  display: inline-block;
  margin: 0 0 12px;
  color: var(--ink);
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 600;
}
/* The group's own link: quiet like the footer's, beside the label on a phone,
   a line over the group's cards on a laptop. */
.group__more {
  display: inline-block;
  margin: 0 0 12px 12px;
  color: var(--dim);
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.group__more:hover { color: var(--accent); }
.work { list-style: none; margin: 0; padding: 0; }
/* Each card is a shade, no border, with its picture or clip inset 8px; the
   picture's corners are the card's less that gap. */
.work__link {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 8px 24px;
  border-radius: 16px;
  background: var(--surface);
}
.work__link:hover, .chip:hover span { background: var(--line); }
.work__link:active { transform: scale(0.99); }
.work__media {
  display: block;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg);
}
.work__media video, .work__media img {
  display: block;
  width: 100%;
  height: auto;
}
.work__media--clip img { display: none; }
.work__text {
  display: block;
  padding: 0 12px;
}
.work__name {
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
/* On hover the name turns gold and an arrow slides in: across for a page here,
   up and out for another site. */
.work__name::after {
  content: " →";
  display: inline-block;
  opacity: 0;
  transform: translateX(-4px);
}
.work__link:not([href^="https://ferdousbhai.com"]) .work__name::after { content: " ↗"; }
.work__link:hover .work__name,
.work__link:focus-visible .work__name { color: var(--accent); }
.work__link:hover .work__name::after,
.work__link:focus-visible .work__name::after { opacity: 1; transform: none; }
.work__tag {
  margin-left: 8px;
  padding: 2px 8px;
  border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  border-radius: 4px;
  color: var(--accent);
  font-family: var(--mono);
  font-size: 0.75rem;
  line-height: 1rem;
  vertical-align: 2px;
}
.work__blurb {
  display: block;
  margin-top: 4px;
  color: var(--dim);
  text-wrap: pretty;
}

/* For readers who ask for less motion, the clip gives way to its still. */
@media (prefers-reduced-motion: reduce) {
  .work__media--clip video { display: none; }
  .work__media--clip img { display: block; }
}

/* On a phone or tablet each group is a shelf: its label over its cards in one
   row that runs to the frame's edges and swipes sideways, the next card
   showing at the edge to say there is more. */
@media (width < 56rem) {
  .chips { display: none; }
  .group + .group { margin-top: 40px; }
  .work {
    margin-inline: calc(-1 * var(--gutter));
    padding-inline: var(--gutter);
    display: flex;
    gap: 12px;
    scroll-padding-inline: var(--gutter);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }
  .work > li { flex: none; width: min(85%, 26rem); scroll-snap-align: start; }
}

/* On a laptop the shelves fold into one grid, three to a row, under a row of
   chips that narrow it to one group. The chips stand in for the labels, which
   stay for screen readers as the page's outline. */
@media (width >= 56rem) {
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .chip input, .group__label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .chip span {
    display: block;
    padding: 8px 16px;
    border-radius: 8px;
    background: var(--surface);
    font-weight: 600;
    cursor: pointer;
  }
  .chip input:checked + span { background: var(--ink); color: var(--bg); }
  .gallery {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px 16px;
  }
  .group, .work { display: contents; }
  .group__more { grid-column: 1 / -1; margin: 0; }
${chipStylesheet}
}

`);

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
<title>${escapeHtml(pageTitle ? `${pageTitle} — ${meta.title}` : meta.title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="${BG}">
<link rel="canonical" href="${SITE_URL}${path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtml(meta.title)}">
<meta property="og:title" content="${escapeHtml(pageTitle ?? meta.title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${SITE_URL}${path}">
<meta property="og:image" content="${SITE_URL}${card.src}">
<meta property="og:image:width" content="${CARD.width}">
<meta property="og:image:height" content="${CARD.height}">
<meta property="og:image:alt" content="${escapeHtml(card.alt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preload" href="/fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="alternate" type="text/markdown" href="${markdownPath(path)}">
<style>${stylesheet}${pageTitle ? "" : galleryStylesheet}</style>${jsonLd ? `\n<script type="application/ld+json">\n${jsonLd}\n</script>` : ""}
</head>
<body>
  <div class="frame">
    <header class="bar">
      ${pageTitle ? `<a class="bar__name" href="/">${escapeHtml(meta.title)}</a>
      <span class="bar__page">${escapeHtml(pageTitle)}</span>` : `<span class="bar__name">${escapeHtml(meta.title)}</span>`}
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
.card h1 { margin: 0; font-size: 72px; line-height: 1; font-weight: 600; letter-spacing: -0.025em; }
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
      <h1>${escapeHtml(pageTitle ?? meta.title)}</h1>
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
    alt: `${route.pageTitle ?? meta.title}: ${route.description}`,
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
    // The card names its screenshot and fonts from the site root, and is hashed
    // that way; only the copy Chromium opens points into public/ on this machine.
    const source = `${workDir}${stem(path)}.html`;
    writeFileSync(
      source,
      card.html.replace(' src="/', ` src="file://${publicDir}`).replaceAll('url("/fonts/', `url("file://${publicDir}fonts/`),
    );
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
  "_headers": `/*
  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Strict-Transport-Security: max-age=31536000

${routeHeaders}

/favicon.svg
  Cache-Control: public, max-age=604800

/favicon.ico
  Cache-Control: public, max-age=604800

/fonts/*
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
