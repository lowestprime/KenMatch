import assert from "node:assert/strict";
import test from "node:test";

import {
  isNavigationContextTurnover,
  retryNavigationContextTurnover,
  SETTLE_NAVIGATION_ATTEMPTS,
} from "./settle.js";

test("navigation context turnover is retried and then settles", async () => {
  let operations = 0;
  let turnovers = 0;
  const result = await retryNavigationContextTurnover({
    operation: async () => {
      operations += 1;
      if (operations < SETTLE_NAVIGATION_ATTEMPTS) {
        throw new Error("page.evaluate: Execution context was destroyed, most likely because of a navigation");
      }
      return "settled";
    },
    afterTurnover: async () => {
      turnovers += 1;
    },
  });

  assert.equal(result, "settled");
  assert.equal(operations, SETTLE_NAVIGATION_ATTEMPTS);
  assert.equal(turnovers, SETTLE_NAVIGATION_ATTEMPTS - 1);
});

test("navigation context turnover remains bounded", async () => {
  let operations = 0;
  await assert.rejects(
    retryNavigationContextTurnover({
      operation: async () => {
        operations += 1;
        throw new Error("page.evaluate: Cannot find context with specified id");
      },
      afterTurnover: async () => undefined,
    }),
    /Cannot find context with specified id/,
  );
  assert.equal(operations, SETTLE_NAVIGATION_ATTEMPTS);
});

test("non-navigation failures are never retried", async () => {
  let operations = 0;
  let turnovers = 0;
  await assert.rejects(
    retryNavigationContextTurnover({
      operation: async () => {
        operations += 1;
        throw new Error("Visible image failed to decode");
      },
      afterTurnover: async () => {
        turnovers += 1;
      },
    }),
    /Visible image failed to decode/,
  );
  assert.equal(operations, 1);
  assert.equal(turnovers, 0);
  assert.equal(isNavigationContextTurnover(new Error("Target page has been closed")), false);
});
