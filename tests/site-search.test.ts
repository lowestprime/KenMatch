import assert from "node:assert/strict";
import test from "node:test";

import { filterSearchItems } from "../src/lib/site-search.ts";
import type { SearchResultItem } from "../src/lib/types.ts";

const items = [
  { id: "1", type: "page", title: "What is a Ken?", subtitle: "A bounded public proposal", url: "/faq#what-is-a-ken" },
  { id: "2", type: "ken", title: "Safety harness", subtitle: "Agent reliability", url: "/kens/safety-harness" },
  { id: "3", type: "profile", title: "Safety reviewer", subtitle: "Evaluation", url: "/people/safety-reviewer" },
] satisfies SearchResultItem[];

test("site search is deterministic, bounded, and token-aware", () => {
  assert.deepEqual(filterSearchItems(items, "safety").map((item) => item.id), ["2", "3"]);
  assert.deepEqual(filterSearchItems(items, "bounded proposal").map((item) => item.id), ["1"]);
  assert.deepEqual(filterSearchItems(items, "missing"), []);
  assert.deepEqual(filterSearchItems(items, "   "), []);
});
