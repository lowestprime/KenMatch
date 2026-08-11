export interface LegacyRedirectLocation {
  pathname: string;
  search: string;
  hash: string;
}

interface RedirectCapture {
  route: string;
  finalUrl: string;
}

export function expectedLegacyRedirectLocation(route: string): LegacyRedirectLocation | null {
  const parsed = new URL(route, "https://audit.invalid");
  if (parsed.pathname === "/about/changelog" || parsed.pathname === "/changelog") {
    return { pathname: "/about", search: "", hash: "#changelog" };
  }
  if (parsed.pathname === "/people") {
    return { pathname: "/profiles", search: "", hash: "" };
  }
  if (parsed.pathname === "/tasks") {
    return { pathname: "/kens", search: "", hash: "" };
  }
  if (parsed.pathname.startsWith("/tasks/")) {
    return {
      pathname: parsed.pathname.replace(/^\/tasks\//, "/kens/"),
      search: parsed.search,
      hash: parsed.hash,
    };
  }
  return null;
}

export function isLegacyRedirectRoute(route: string) {
  return expectedLegacyRedirectLocation(route) !== null;
}

export function isExpectedLegacyRedirectDuplicate(captures: RedirectCapture[]) {
  const redirects = captures.flatMap((capture) => {
    const expected = expectedLegacyRedirectLocation(capture.route);
    return expected ? [{ capture, expected }] : [];
  });
  if (redirects.length === 0) return false;

  const destinationKeys = new Set(
    redirects.map(({ expected }) => `${expected.pathname}${expected.search}`),
  );
  if (destinationKeys.size !== 1) return false;
  const [destinationKey] = destinationKeys;

  for (const { capture, expected } of redirects) {
    const finalUrl = new URL(capture.finalUrl);
    if (
      finalUrl.pathname !== expected.pathname
      || finalUrl.search !== expected.search
      || finalUrl.hash !== expected.hash
    ) {
      return false;
    }
  }

  return captures.every((capture) => {
    const finalUrl = new URL(capture.finalUrl);
    return `${finalUrl.pathname}${finalUrl.search}` === destinationKey;
  });
}
