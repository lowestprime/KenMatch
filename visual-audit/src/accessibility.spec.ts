import assert from "node:assert/strict";
import test from "node:test";

import { focusSignature, type FocusSnapshot } from "./accessibility.js";

const base: FocusSnapshot = {
  tagName: "G",
  id: "",
  name: "",
  role: "button",
  ariaLabel: "United States: 2,007 unique visitors",
  labelledBy: "",
  title: "",
  href: "",
  text: "",
  siblingIndex: 0,
};

test("focus signatures distinguish accessible SVG controls", () => {
  assert.notEqual(
    focusSignature(base),
    focusSignature({
      ...base,
      ariaLabel: "Canada: 483 unique visitors",
      siblingIndex: 1,
    }),
  );
});

test("focus signatures distinguish otherwise identical sibling controls", () => {
  assert.notEqual(
    focusSignature({ ...base, ariaLabel: "" }),
    focusSignature({ ...base, ariaLabel: "", siblingIndex: 1 }),
  );
});

test("focus signatures remain stable when focus does not move", () => {
  assert.equal(focusSignature(base), focusSignature({ ...base }));
  assert.equal(focusSignature(null), "none");
});
