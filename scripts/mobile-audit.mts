/**
 * Mobile layout audit.
 *
 *   npm run dev           # in one terminal
 *   npm run audit:mobile  # in another
 *
 * Loads every public page at real phone widths and reports the two things
 * that are impossible to eyeball reliably:
 *
 *   1. Horizontal overflow — anything sticking out past the viewport that
 *      isn't inside a deliberate scroll container. This is the bug that makes
 *      a page rock sideways under your thumb.
 *   2. Touch targets under 44px, the smallest thing a thumb reliably hits.
 *
 * It clicks "Toss it in" to fill the crate, and nothing else. No forms are
 * submitted, so it never writes to your database.
 */
import { chromium } from "playwright";

const BASE = process.env.AUDIT_URL ?? "http://localhost:3000";

const PAGES = ["/", "/pick", "/rates", "/faq", "/contact", "/book", "/admin/login"];

// Real device widths, smallest first. 320 is the floor we support — iPhone SE
// (1st gen) and the cheap Androids that make up a lot of this audience.
const WIDTHS = [320, 360, 390, 414, 768];

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const OFF = "\x1b[0m";

type Offender = { tag: string; cls: string; right: number; text: string };
type Small = { tag: string; label: string; w: number; h: number };

const browser = await chromium.launch();
const page = await browser.newPage();

let overflowCount = 0;
let touchCount = 0;

async function measure() {
  return page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
}

for (const path of PAGES) {
  console.log(`\n${BOLD}${path}${OFF}`);

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });

    if (!res || res.status() >= 400) {
      console.log(`  ${width}px  ${RED}HTTP ${res?.status() ?? "no response"}${OFF}`);
      continue;
    }

    const offenders = (await page.evaluate((vw) => {
      const bad: Offender[] = [];

      for (const el of Array.from(document.querySelectorAll("*"))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // 1px of slack absorbs subpixel rounding.
        if (r.right <= vw + 1 && r.left >= -1) continue;

        // Inside a deliberate scroller (the rate ticker, the jump nav, the
        // desktop admin table)? Then it's contained, not a bug.
        let p: HTMLElement | null = el.parentElement;
        let clipped = false;
        while (p) {
          if (/auto|scroll|hidden/.test(getComputedStyle(p).overflowX)) {
            clipped = true;
            break;
          }
          p = p.parentElement;
        }
        if (clipped) continue;

        bad.push({
          tag: el.tagName.toLowerCase(),
          cls: String((el as HTMLElement).className ?? "").slice(0, 70),
          right: Math.round(r.right),
          text: (el.textContent ?? "").trim().slice(0, 40),
        });
      }
      // Parents and children both report; the outermost few are the cause.
      return bad.slice(0, 4);
    }, width)) as Offender[];

    const { scrollW, clientW } = await measure();

    if (scrollW > clientW + 1) {
      overflowCount++;
      console.log(
        `  ${width}px  ${RED}scrolls sideways${OFF} (content ${scrollW}px in ${clientW}px)`,
      );
      for (const o of offenders) {
        console.log(`         <${o.tag}> right:${o.right}px  "${o.text}"`);
        console.log(`         class="${o.cls}"`);
      }
    } else {
      console.log(`  ${width}px  ${GREEN}ok${OFF}  no horizontal overflow`);
    }

    // Touch targets, checked once at the most common Android width.
    if (width === 360) {
      const small = (await page.evaluate(() => {
        const out: Small[] = [];
        const sel = 'a, button, input:not([type="hidden"]), select, textarea, summary';
        for (const el of Array.from(document.querySelectorAll(sel))) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.width >= 44 && r.height >= 44) continue;
          // Inline links inside prose are read, not aimed at.
          if (el.tagName === "A" && el.closest("p, li, dd")) continue;
          out.push({
            tag: el.tagName.toLowerCase(),
            label: (el.textContent ?? (el as HTMLInputElement).name ?? "").trim().slice(0, 30),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
        return out.slice(0, 6);
      })) as Small[];

      if (small.length > 0) {
        touchCount += small.length;
        console.log(`         ${YELLOW}${small.length} target(s) under 44px:${OFF}`);
        for (const s of small) {
          console.log(`           <${s.tag}> ${s.w}x${s.h}  "${s.label}"`);
        }
      }
    }
  }
}

// ── the crate-filled state ──────────────────────────────────────────
//
// The pass above ran with an empty crate, so the bottom dock and the header
// badge never rendered — and those are the two things most likely to crowd a
// 360px header. Fill the crate for real and measure again.
console.log(`\n${BOLD}/pick and /book with a full crate${OFF}`);

for (const width of [320, 360, 390]) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(`${BASE}/pick`, { waitUntil: "networkidle" });

  const toss = page.locator('button:has-text("Toss it in")');
  const added = Math.min(await toss.count(), 4);
  for (let i = 0; i < added; i++) {
    await toss.first().click();
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(400);

  for (const path of ["/pick", "/book"]) {
    if (path === "/book") await page.goto(`${BASE}/book`, { waitUntil: "networkidle" });

    const { scrollW, clientW } = await measure();
    const bad = scrollW > clientW + 1;
    if (bad) overflowCount++;

    const verdict = bad
      ? `${RED}scrolls sideways (${scrollW}px in ${clientW}px)${OFF}`
      : `${GREEN}ok${OFF}`;
    console.log(`  ${width}px ${path.padEnd(6)} ${verdict} — ${added} item(s) in the crate`);
  }

  // Leave the crate empty for the next width.
  await page.evaluate(() => localStorage.removeItem("mint.crate.v1"));
}

await browser.close();

console.log(
  `\n${
    overflowCount === 0
      ? `${GREEN}No horizontal overflow anywhere.${OFF}`
      : `${RED}${overflowCount} viewport(s) scroll sideways.${OFF}`
  }`,
);
if (touchCount > 0) {
  console.log(`${YELLOW}${touchCount} touch target(s) under 44px at 360px.${OFF}`);
}
console.log("");

process.exit(overflowCount === 0 ? 0 : 1);
