import type { Page } from "playwright";

const FREEZE_STYLE_ID = "kenmatch-visual-audit-freeze";

async function waitForImages(page: Page) {
  await page.evaluate(async () => {
    const images = [...document.images];
    await Promise.all(images.map(async (image) => {
      if (image.complete) {
        try {
          await image.decode();
        } catch {
          // A broken image is reported separately by diagnostics.
        }
        return;
      }
      await new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
        window.setTimeout(resolve, 5_000);
      });
    }));
  });
}

async function drainPage(page: Page) {
  await page.evaluate(async () => {
    const root = document.scrollingElement ?? document.documentElement;
    const step = Math.max(240, Math.floor(window.innerHeight * 0.72));
    for (let top = 0; top < root.scrollHeight; top += step) {
      window.scrollTo(0, top);
      await new Promise((resolve) => window.setTimeout(resolve, 20));
    }
    window.scrollTo(0, root.scrollHeight);
    await new Promise((resolve) => window.setTimeout(resolve, 80));

    const scrollables = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => {
        const style = getComputedStyle(element);
        return element.scrollHeight > element.clientHeight + 2
          && ["auto", "scroll"].includes(style.overflowY)
          && element.clientHeight > 60;
      })
      .slice(0, 20);
    for (const element of scrollables) {
      element.scrollTop = element.scrollHeight;
      await new Promise((resolve) => window.setTimeout(resolve, 20));
      element.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  });
}

export async function settlePage(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    if ("fonts" in document) await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await drainPage(page);
  await waitForImages(page);
  await page.waitForTimeout(350);
  await page.evaluate((styleId) => {
    document.getElementById(styleId)?.remove();
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      html { scroll-behavior: auto !important; }
      .site-header { position: relative !important; top: auto !important; }
      .reading-progress { display: none !important; }
      *, *::before, *::after {
        animation-play-state: paused !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.append(style);
    window.scrollTo(0, 0);
  }, FREEZE_STYLE_ID);
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}
