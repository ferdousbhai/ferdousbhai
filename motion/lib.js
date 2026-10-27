// Shared by every scene: pure functions of time, so render(t) stays
// deterministic. Times are in seconds.

// The site's curves: --e for things arriving, --io for things moving across.
const bezier = (x1, y1, x2, y2) => (x) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0, hi = 1, s = x;
  for (let i = 0; i < 24; i++) {
    s = (lo + hi) / 2;
    const bx = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
    if (bx < x) lo = s; else hi = s;
  }
  return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
};
const easeOut = bezier(0.16, 1, 0.3, 1);
const easeInOut = bezier(0.65, 0, 0.35, 1);
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

// 0 before start, 1 after start + duration, eased in between.
const progress = (t, start, duration, ease = easeOut) => ease(clamp((t - start) / duration));

// [[time, value], ...] eased per segment; values may be numbers or arrays.
const track = (keys, t, ease = easeInOut) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) {
      const k = ease(clamp((t - t0) / (t1 - t0 || 1)));
      return Array.isArray(v0) ? v0.map((v, j) => v + (v1[j] - v) * k) : v0 + (v1 - v0) * k;
    }
  }
  return keys[keys.length - 1][1];
};

// The part of text typed by time t, at one character every `step` seconds.
const typed = (text, t, start, step = 0.05) => text.slice(0, Math.max(0, Math.floor((t - start) / step)));

// The appear used everywhere: rise 10px and resolve from a 4px blur.
const appear = (el, k, rise = 10) => {
  el.style.opacity = k;
  el.style.transform = `translateY(${(1 - k) * rise}px)`;
  el.style.filter = k >= 1 ? "none" : `blur(${(1 - k) * 4}px)`;
};

// The whole stage fades out over the last `fade` seconds and in over the
// first, so the cycle closes on the empty frame it opened with.
const cycleFade = (stage, t, cycle, fade = 0.5) => {
  stage.style.opacity = Math.min(clamp(t / fade), clamp((cycle - t) / fade));
};
