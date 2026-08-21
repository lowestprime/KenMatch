const ROUTE_BASE = "https://audit.invalid";

function normalizedUrl(route: string) {
  const url = new URL(route, ROUTE_BASE);
  const sortedParams = [...url.searchParams.entries()]
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => (
      leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue)
    ));
  url.search = "";
  for (const [key, value] of sortedParams) url.searchParams.append(key, value);
  url.hash = url.pathname === "/about" && url.hash === "#changelog"
    ? "#changelog"
    : "";
  return url;
}

export function normalizeRenderedRoute(route: string) {
  const url = normalizedUrl(route);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function normalizeRenderedRoutes(routes: readonly string[]) {
  return [...new Set(routes.map(normalizeRenderedRoute))]
    .sort((left, right) => left.localeCompare(right));
}

export function renderedRouteEquivalenceKey(route: string) {
  const url = normalizedUrl(route);
  const parameterNames = [...new Set(url.searchParams.keys())]
    .sort((left, right) => left.localeCompare(right));
  const queryShape = parameterNames.length > 0 ? `?${parameterNames.join("&")}` : "";
  return `${url.pathname}${queryShape}${url.hash}`;
}

export function renderedRoutePathname(route: string) {
  return normalizedUrl(route).pathname;
}

export function selectRenderedRouteRepresentatives(input: {
  renderedRoutes: readonly string[];
  existingTargetRoutes: readonly string[];
  retainedCaptureRoutes?: readonly string[];
  maxNewRepresentatives?: number;
}) {
  const renderedRoutes = normalizeRenderedRoutes(input.renderedRoutes);
  const renderedRouteSet = new Set(renderedRoutes);
  const existingTargetRoutes = normalizeRenderedRoutes(input.existingTargetRoutes);
  const existingByClass = new Map<string, string>();
  for (const route of existingTargetRoutes) {
    const key = renderedRouteEquivalenceKey(route);
    if (!existingByClass.has(key)) existingByClass.set(key, route);
  }

  const candidatesByClass = new Map<string, string[]>();
  for (const route of renderedRoutes) {
    const key = renderedRouteEquivalenceKey(route);
    if (existingByClass.has(key)) continue;
    const candidates = candidatesByClass.get(key) ?? [];
    candidates.push(route);
    candidatesByClass.set(key, candidates);
  }

  const retainedByClass = new Map<string, string>();
  for (const route of normalizeRenderedRoutes(input.retainedCaptureRoutes ?? [])) {
    const key = renderedRouteEquivalenceKey(route);
    if (
      renderedRouteSet.has(route)
      && candidatesByClass.has(key)
      && !retainedByClass.has(key)
    ) {
      retainedByClass.set(key, route);
    }
  }

  const retainedClasses = [...retainedByClass.keys()]
    .sort((left, right) => retainedByClass.get(left)!.localeCompare(retainedByClass.get(right)!));
  const newClasses = [...candidatesByClass.keys()]
    .filter((key) => !retainedByClass.has(key))
    .sort((left, right) => left.localeCompare(right));
  const limit = input.maxNewRepresentatives ?? Number.POSITIVE_INFINITY;
  const selectedClasses = [...retainedClasses, ...newClasses].slice(0, limit);
  const representativeByClass = new Map(existingByClass);
  const captureRoutes: string[] = [];
  for (const key of selectedClasses) {
    const route = retainedByClass.get(key) ?? candidatesByClass.get(key)?.[0];
    if (!route) continue;
    representativeByClass.set(key, route);
    captureRoutes.push(route);
  }

  return {
    renderedRoutes,
    captureRoutes: captureRoutes.sort((left, right) => left.localeCompare(right)),
    representativeByClass,
  };
}
