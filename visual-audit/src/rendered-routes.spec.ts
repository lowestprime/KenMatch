import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeRenderedRoute,
  renderedRouteEquivalenceKey,
  selectRenderedRouteRepresentatives,
} from "./rendered-routes.js";

test("rendered routes normalize query ordering and preserve only the canonical changelog hash", () => {
  assert.equal(
    normalizeRenderedRoute("/discuss?topic=safety&sort=new#ignored"),
    "/discuss?sort=new&topic=safety",
  );
  assert.equal(normalizeRenderedRoute("/about?z=2&a=1#changelog"), "/about?a=1&z=2#changelog");
  assert.equal(renderedRouteEquivalenceKey("/discuss?topic=safety&sort=new"), "/discuss?sort&topic");
  assert.equal(renderedRouteEquivalenceKey("/discuss?sort=comments&topic=evidence"), "/discuss?sort&topic");
});

test("production pagination and discussion permutations select one stable representative per query shape", () => {
  const selection = selectRenderedRouteRepresentatives({
    existingTargetRoutes: ["/admin", "/discuss", "/discuss?sort=saved"],
    renderedRoutes: [
      "/admin?auditPage=4",
      "/admin?auditPage=1",
      "/admin?auditPage=3",
      "/admin?auditPage=2",
      "/discuss?topic=safety",
      "/discuss?topic=evidence",
      "/discuss?sort=new",
      "/discuss?sort=comments",
      "/discuss?topic=safety&sort=new",
      "/discuss?sort=comments&topic=evidence",
      "/discuss?topic=safety&sort=new",
    ],
  });

  assert.deepEqual(selection.captureRoutes, [
    "/admin?auditPage=1",
    "/discuss?sort=comments&topic=evidence",
    "/discuss?topic=evidence",
  ]);
  assert.equal(selection.representativeByClass.get("/admin?auditPage"), "/admin?auditPage=1");
  assert.equal(selection.representativeByClass.get("/discuss?sort"), "/discuss?sort=saved");
  assert.equal(selection.representativeByClass.get("/discuss?sort&topic"), "/discuss?sort=comments&topic=evidence");
});

test("a retained representative remains stable when later pagination values sort earlier", () => {
  const first = selectRenderedRouteRepresentatives({
    existingTargetRoutes: ["/admin"],
    renderedRoutes: ["/admin?auditPage=4"],
  });
  const expanded = selectRenderedRouteRepresentatives({
    existingTargetRoutes: ["/admin"],
    renderedRoutes: [
      "/admin?auditPage=1",
      "/admin?auditPage=2",
      "/admin?auditPage=3",
      "/admin?auditPage=4",
      "/admin?auditPage=5",
    ],
    retainedCaptureRoutes: first.captureRoutes,
  });

  assert.deepEqual(first.captureRoutes, ["/admin?auditPage=4"]);
  assert.deepEqual(expanded.captureRoutes, first.captureRoutes);
});

test("representative selection is independent of rendered-link ordering and duplication", () => {
  const routes = [
    "/faq?category=governance&q=public",
    "/faq?q=public&category=safety",
    "/glossary?status=adopted",
  ];
  const first = selectRenderedRouteRepresentatives({ existingTargetRoutes: ["/faq", "/glossary"], renderedRoutes: routes });
  const repeated = selectRenderedRouteRepresentatives({
    existingTargetRoutes: ["/glossary", "/faq"],
    renderedRoutes: [routes[2]!, routes[0]!, routes[1]!, routes[0]!],
  });
  assert.deepEqual(first.renderedRoutes, repeated.renderedRoutes);
  assert.deepEqual(first.captureRoutes, repeated.captureRoutes);
});
