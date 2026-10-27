// Records each project's clip from its scene, motion/<slug>.html, into
// public/img/work/<slug>.mp4 and its poster <slug>.webp. A scene is a fixed
// 1280×800 stage that draws itself entirely from one number: it defines
// window.CYCLE (the loop's length in seconds), window.POSTER (the moment the
// still shows) and window.render(t), which sets every element for time t.
// Nothing in a scene runs on its own clock, so stepping t and screenshotting
// gives the same clip every run, and render(0) matching render(CYCLE) makes the
// loop seamless. The deploy has no browser, so the clips are tracked.
//
//   pnpm motion            every scene
//   pnpm motion recall     one scene
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const sceneDir = repositoryRoot + "motion/";
const outDir = repositoryRoot + "public/img/work/";
const STAGE = { width: 1280, height: 800 };
const FPS = 30;

const slugs = process.argv.length > 2
  ? process.argv.slice(2)
  : readdirSync(sceneDir).filter((file) => file.endsWith(".html")).map((file) => file.slice(0, -5));

// ffmpeg reads PNG frames on stdin and writes one file.
const encoder = (args) => {
  const ffmpeg = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", ...args]);
  const done = new Promise((resolve, reject) => {
    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => (stderr += chunk));
    ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg: ${stderr}`))));
  });
  const write = (frame) => new Promise((resolve) => (ffmpeg.stdin.write(frame) ? resolve() : ffmpeg.stdin.once("drain", resolve)));
  return { write, end: () => (ffmpeg.stdin.end(), done) };
};

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium" });
const page = await browser.newPage({ viewport: STAGE, deviceScaleFactor: 1 });

for (const slug of slugs) {
  await page.goto(`file://${sceneDir}${slug}.html`);
  await page.evaluate(() => document.fonts.ready);
  const { cycle, poster } = await page.evaluate(() => ({ cycle: window.CYCLE, poster: window.POSTER }));
  const shoot = async (t) => {
    await page.evaluate((t) => window.render(t), t);
    return page.screenshot({ type: "png" });
  };

  // A loop that does not close shows a jump every time it repeats.
  if (!(await shoot(0)).equals(await shoot(cycle))) console.warn(`${slug}: render(0) and render(${cycle}) differ; the loop will jump`);

  const clip = encoder([
    "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", `${outDir}${slug}.mp4`,
  ]);
  // The clip starts at the poster's moment and wraps round the loop, so the
  // page opens on every story mid-act rather than on its empty first frame,
  // and the poster and the first frame are the same picture.
  const frames = Math.round(cycle * FPS);
  for (let i = 0; i < frames; i++) await clip.write(await shoot((poster + i / FPS) % cycle));
  await clip.end();

  const still = encoder(["-frames:v", "1", "-c:v", "libwebp", "-quality", "85", `${outDir}${slug}.webp`]);
  await still.write(await shoot(poster));
  await still.end();
  console.log(`recorded public/img/work/${slug}.mp4 (${frames} frames) and ${slug}.webp`);
}

await browser.close();
