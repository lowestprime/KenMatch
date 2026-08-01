import type { Page } from "playwright";

import type { AccessibilityResult } from "./types.js";

export async function inspectAccessibility(page: Page, mobile: boolean): Promise<AccessibilityResult> {
  const structural = await page.evaluate((isMobile) => {
    const visible = (element: Element) => {
      const node = element as HTMLElement;
      if (node.closest('[aria-hidden="true"]')) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && rect.width > 0
        && rect.height > 0;
    };
    const skip = document.querySelector<HTMLAnchorElement>('a[href^="#"].skip-link');
    const targetId = skip?.getAttribute("href")?.slice(1) ?? "";
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .filter(visible)
      .map((heading) => Number.parseInt(heading.tagName.slice(1), 10));
    const busy = Boolean(document.querySelector('[aria-busy="true"]'));
    let headingOrderValid = busy || headings[0] === 1;
    for (let index = 1; index < headings.length; index += 1) {
      if ((headings[index] ?? 1) - (headings[index - 1] ?? 1) > 1) headingOrderValid = false;
    }
    const controls = [...document.querySelectorAll<HTMLElement>(
      "button,input:not([type=hidden]),select,textarea,a[href],[role=button],[role=link]",
    )].filter(visible);
    const unlabeledControls = controls.filter((element) => {
      if (element instanceof HTMLAnchorElement) return !(element.textContent?.trim() || element.getAttribute("aria-label"));
      if (element instanceof HTMLInputElement && ["submit", "button"].includes(element.type)) {
        return !(element.value || element.getAttribute("aria-label"));
      }
      const id = element.id;
      const explicitLabel = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      const implicitLabel = element.closest("label");
      return !(element.getAttribute("aria-label")
        || element.getAttribute("aria-labelledby")
        || explicitLabel
        || implicitLabel
        || element.textContent?.trim()
        || element.getAttribute("title"));
    }).length;
    const undersizedTouchTargets = isMobile
      ? controls.filter((element) => {
        const rect = element.getBoundingClientRect();
        const isInlineTextLink = element instanceof HTMLAnchorElement
          && getComputedStyle(element).display === "inline";
        const hasLargeAssociatedLabel = element instanceof HTMLInputElement
          && ["checkbox", "radio"].includes(element.type)
          && [...(element.labels ?? [])]
            .filter(visible)
            .some((label) => {
              const labelRect = label.getBoundingClientRect();
              return labelRect.width >= 44 && labelRect.height >= 44;
            });
        return !isInlineTextLink
          && !hasLargeAssociatedLabel
          && (rect.width < 44 || rect.height < 44);
      }).length
      : 0;
    const rootOverflow = Math.max(
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth,
      0,
    );
    return {
      skipLinkPresent: Boolean(skip),
      skipLinkTargetValid: Boolean(targetId && document.getElementById(targetId)),
      headingOrderValid,
      unlabeledControls,
      undersizedTouchTargets,
      horizontalOverflowPx: rootOverflow,
      hasH1: busy || headings.includes(1),
      busy,
      focusableCount: controls.length,
    };
  }, mobile);

  const skipLinkActivationValid = structural.skipLinkPresent && structural.skipLinkTargetValid
    ? await page.evaluate(async () => {
      const skip = document.querySelector<HTMLAnchorElement>("a.skip-link");
      const target = document.getElementById("main-content");
      if (!skip || !target) return false;
      const originalUrl = `${location.pathname}${location.search}${location.hash}`;
      skip.focus();
      skip.click();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const activated = document.activeElement === target;
      history.replaceState(null, "", originalUrl);
      return activated;
    })
    : false;
  const hasInitialFocus = await page.evaluate(() => (
    Boolean(document.activeElement && document.activeElement !== document.body)
  ));
  if (!hasInitialFocus) await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || active === document.body) {
      return { keyboardReachable: false, focusVisible: false };
    }
    const style = getComputedStyle(active);
    return {
      keyboardReachable: true,
      focusVisible: style.outlineStyle !== "none"
        || style.outlineWidth !== "0px"
        || style.boxShadow !== "none"
        || active.matches(":focus-visible"),
    };
  });
  if (structural.busy && structural.focusableCount === 0) {
    focus.keyboardReachable = true;
    focus.focusVisible = true;
  }

  const focusSignatures = new Set<string>();
  let keyboardTrapDetected = false;
  for (let index = 0; index < 24; index += 1) {
    await page.keyboard.press("Tab");
    const signature = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return "none";
      return `${active.tagName}:${active.id}:${active.getAttribute("name") ?? ""}:${active.textContent?.trim().slice(0, 40) ?? ""}`;
    });
    if (index > 8 && focusSignatures.size <= 1) keyboardTrapDetected = true;
    focusSignatures.add(signature);
  }

  await page.evaluate(() => {
    const freeze = document.getElementById("kenmatch-visual-audit-freeze") as HTMLStyleElement | null;
    if (freeze) freeze.disabled = true;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotionStable = await page.evaluate(() => {
    const animated = [...document.querySelectorAll<HTMLElement>("body *")].filter((element) => {
      const style = getComputedStyle(element);
      const durations = `${style.animationDuration},${style.transitionDuration}`
        .split(",")
        .map((value) => Number.parseFloat(value) || 0);
      return durations.some((duration) => duration > 0.05);
    });
    return animated.length === 0;
  });

  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const forcedColorsUsable = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const main = document.querySelector("main");
    const rect = main?.getBoundingClientRect();
    return body.color !== body.backgroundColor
      && Boolean(rect && rect.width > 0 && rect.height > 0);
  });
  await page.emulateMedia({ forcedColors: "none", reducedMotion: "no-preference" });
  await page.evaluate(() => {
    const freeze = document.getElementById("kenmatch-visual-audit-freeze") as HTMLStyleElement | null;
    if (freeze) freeze.disabled = false;
  });

  const seriousViolations: string[] = [];
  if (!structural.skipLinkPresent || !structural.skipLinkTargetValid) seriousViolations.push("skip-link");
  else if (!skipLinkActivationValid) seriousViolations.push("skip-link-activation");
  if (!structural.hasH1 || !structural.headingOrderValid) seriousViolations.push("heading-structure");
  if (structural.unlabeledControls > 0) seriousViolations.push(`unlabeled-controls:${structural.unlabeledControls}`);
  if (structural.horizontalOverflowPx > 1) seriousViolations.push(`horizontal-overflow:${structural.horizontalOverflowPx}`);
  if (keyboardTrapDetected) seriousViolations.push("keyboard-trap");
  if (!focus.keyboardReachable || !focus.focusVisible) seriousViolations.push("focus-visibility");
  if (!forcedColorsUsable) seriousViolations.push("forced-colors");

  return {
    skipLinkPresent: structural.skipLinkPresent,
    skipLinkTargetValid: structural.skipLinkTargetValid,
    skipLinkActivationValid,
    keyboardReachable: focus.keyboardReachable,
    keyboardTrapDetected,
    focusVisible: focus.focusVisible,
    horizontalOverflowPx: structural.horizontalOverflowPx,
    undersizedTouchTargets: structural.undersizedTouchTargets,
    reducedMotionStable,
    forcedColorsUsable,
    headingOrderValid: structural.headingOrderValid,
    unlabeledControls: structural.unlabeledControls,
    seriousViolations,
  };
}
