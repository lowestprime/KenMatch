"use strict";

// Legacy ESLint plugins require a CommonJS callable export.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const modern = require("minimatch-modern");

function minimatch(path, pattern, options) {
  return modern.minimatch(path, pattern, options);
}

Object.assign(minimatch, modern);
minimatch.default = minimatch;
minimatch.minimatch = modern.minimatch;

module.exports = minimatch;
