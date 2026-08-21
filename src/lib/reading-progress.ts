const LONG_READING_PATHS = new Set([
  "/about",
  "/economics",
  "/faq",
  "/glossary",
  "/governance",
]);

export function isLongReadingPath(pathname: string) {
  return LONG_READING_PATHS.has(pathname.replace(/\/+$/, "") || "/");
}

export function qualifiesAsLongReadingSurface(contentHeight: number, viewportHeight: number) {
  return contentHeight >= Math.max(1800, viewportHeight * 2.25);
}

export function calculateReadingProgress(scrollY: number, contentTop: number, contentHeight: number, viewportHeight: number) {
  const travel = Math.max(1, contentHeight - viewportHeight);
  const value = ((scrollY - contentTop) / travel) * 100;
  return Math.min(100, Math.max(0, value));
}
