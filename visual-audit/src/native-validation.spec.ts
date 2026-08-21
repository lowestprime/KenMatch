import assert from "node:assert/strict";
import test from "node:test";

import { chromium, type Page } from "playwright";

import { assertNativeInvalidSubmission } from "./capture.js";

async function installFixture(page: Page, html: string) {
  await page.setContent(`
    <!doctype html>
    <html><body>
      ${html}
      <script>
        window.__submitted = false;
        document.querySelector('form').addEventListener('submit', (event) => {
          window.__submitted = true;
          event.preventDefault();
        });
      </script>
    </body></html>
  `);
}

test("category and Ken empty submissions stay native, focused, and mutation-free", async (context) => {
  const browser = await chromium.launch({ headless: true });
  try {
    await context.test("category proposal", async () => {
      const page = await browser.newPage();
      await installFixture(page, `
        <form class="category-proposal-panel" method="post" action="https://audit.invalid/category">
          <input name="name" required minlength="4">
          <textarea name="description" required minlength="60"></textarea>
          <textarea name="publicBenefit" required minlength="60"></textarea>
          <textarea name="exampleKens" required minlength="20"></textarea>
          <button type="submit">Propose category</button>
        </form>
      `);
      await assertNativeInvalidSubmission(page, {
        formSelector: "form.category-proposal-panel",
        submitButtonName: "Propose category",
        firstInvalidName: "name",
      });
      assert.equal(await page.evaluate(() => (window as Window & { __submitted?: boolean }).__submitted), false);
      await page.close();
    });

    await context.test("Ken proposal", async () => {
      const page = await browser.newPage();
      await installFixture(page, `
        <form class="ken-proposal-panel" method="post" action="https://audit.invalid/ken">
          <input name="title" required minlength="8">
          <select name="categorySlug" required><option value="safety">Safety</option></select>
          <textarea name="summary" required minlength="30"></textarea>
          <button type="submit">Submit Ken for review</button>
        </form>
      `);
      await assertNativeInvalidSubmission(page, {
        formSelector: "form.ken-proposal-panel",
        submitButtonName: "Submit Ken for review",
        firstInvalidName: "title",
      });
      assert.equal(await page.evaluate(() => (window as Window & { __submitted?: boolean }).__submitted), false);
      await page.close();
    });
  } finally {
    await browser.close();
  }
});
