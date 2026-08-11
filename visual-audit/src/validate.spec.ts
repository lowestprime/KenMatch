import assert from "node:assert/strict";
import test from "node:test";

import {
  renderedRouteDispositionFailures,
  stateCovered,
} from "./validate.js";
import type { CaptureRecord } from "./types.js";

const reason = "A documented rendered-route coverage decision.";

const captures = [
  { theme: "light", auth: "anonymous", state: "default" },
  { theme: "oled", auth: "user", state: "ken-stage:running" },
  { theme: "oled", auth: "admin", state: "lane-state:months" },
] as CaptureRecord[];

test("state coverage derives theme, auth, stage, and lane states", () => {
  assert.equal(stateCovered("light-theme", captures), true);
  assert.equal(stateCovered("oled-theme", captures), true);
  assert.equal(stateCovered("anonymous", captures), true);
  assert.equal(stateCovered("signed-in-user", captures), true);
  assert.equal(stateCovered("ken-stage", captures), true);
  assert.equal(stateCovered("lane-state", captures), true);
  assert.equal(stateCovered("maintenance", captures), false);
});

test("full validation accepts exact captures and stable same-query-shape representatives", () => {
  const renderedRoutes = [
    "/admin?auditPage=1",
    "/admin?auditPage=4",
    "/discuss?sort=comments&topic=funding",
    "/discuss?sort=new&topic=safety",
  ];
  const failures = renderedRouteDispositionFailures({
    scope: "full",
    renderedRoutes,
    manifestRenderedRoutes: [...renderedRoutes],
    plannedRoutes: new Set([
      "/admin?auditPage=1",
      "/discuss?sort=comments&topic=funding",
    ]),
    routeDispositions: [
      {
        route: "/admin?auditPage=1",
        disposition: "captured",
        representativeRoute: "/admin?auditPage=1",
        reason,
      },
      {
        route: "/admin?auditPage=4",
        disposition: "equivalent",
        representativeRoute: "/admin?auditPage=1",
        reason,
      },
      {
        route: "/discuss?sort=comments&topic=funding",
        disposition: "captured",
        representativeRoute: "/discuss?sort=comments&topic=funding",
        reason,
      },
      {
        route: "/discuss?sort=new&topic=safety",
        disposition: "equivalent",
        representativeRoute: "/discuss?sort=comments&topic=funding",
        reason,
      },
    ],
  });

  assert.deepEqual(failures, []);
});

test("full validation rejects different query shapes and arbitrary pathname fallbacks", () => {
  const failures = renderedRouteDispositionFailures({
    scope: "full",
    renderedRoutes: [
      "/admin?auditPage=4&sort=recent",
      "/faq?category=participation",
    ],
    manifestRenderedRoutes: [
      "/admin?auditPage=4&sort=recent",
      "/faq?category=participation",
    ],
    plannedRoutes: new Set(["/admin?auditPage=1", "/"]),
    routeDispositions: [
      {
        route: "/admin?auditPage=4&sort=recent",
        disposition: "equivalent",
        representativeRoute: "/admin?auditPage=1",
        reason,
      },
      {
        route: "/faq?category=participation",
        disposition: "equivalent",
        representativeRoute: "/",
        reason,
      },
    ],
  });

  assert.equal(failures.length, 2);
  assert.ok(failures.every((failure) => failure.includes("query shape")));
});

test("validation rejects missing targets, missing reasons, duplicate dispositions, and inventory drift", () => {
  const failures = renderedRouteDispositionFailures({
    scope: "full",
    renderedRoutes: ["/faq?topic=one", "/faq?topic=one", "/about"],
    manifestRenderedRoutes: ["/faq?topic=one"],
    plannedRoutes: new Set(["/about"]),
    routeDispositions: [
      {
        route: "/faq?topic=one",
        disposition: "equivalent",
        representativeRoute: "/faq?topic=two",
        reason,
      },
      {
        route: "/faq?topic=one",
        disposition: "equivalent",
        representativeRoute: "/faq?topic=two",
        reason,
      },
      {
        route: "/about",
        disposition: "captured",
        representativeRoute: "/about",
        reason: " ",
      },
    ],
  });

  assert.ok(failures.includes("coverage plan contains duplicate rendered routes"));
  assert.ok(failures.includes("coverage-plan and manifest rendered-link inventories differ"));
  assert.ok(failures.includes("coverage plan contains duplicate rendered-route dispositions"));
  assert.ok(failures.some((failure) => failure.includes("uncaptured representative")));
  assert.ok(failures.some((failure) => failure.includes("no documented disposition")));
});

test("smoke validation accepts a documented same-path fallback for an unsampled query shape", () => {
  const failures = renderedRouteDispositionFailures({
    scope: "smoke",
    renderedRoutes: ["/faq?category=participation"],
    manifestRenderedRoutes: ["/faq?category=participation"],
    plannedRoutes: new Set(["/faq"]),
    routeDispositions: [{
      route: "/faq?category=participation",
      disposition: "equivalent",
      representativeRoute: "/faq",
      reason: "Smoke scope records the canonical pathname fallback.",
    }],
  });

  assert.deepEqual(failures, []);
});

test("smoke validation accepts a documented captured baseline for an unsampled pathname", () => {
  const failures = renderedRouteDispositionFailures({
    scope: "smoke",
    renderedRoutes: ["/faq?category=participation"],
    manifestRenderedRoutes: ["/faq?category=participation"],
    plannedRoutes: new Set(["/"]),
    routeDispositions: [{
      route: "/faq?category=participation",
      disposition: "equivalent",
      representativeRoute: "/",
      reason: "Smoke scope fallback.",
    }],
  });

  assert.deepEqual(failures, []);
});
