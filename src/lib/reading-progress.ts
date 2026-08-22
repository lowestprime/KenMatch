export function calculatePageProgress(scrollY: number, documentHeight: number, viewportHeight: number) {
  const travel = documentHeight - viewportHeight;
  if (travel <= 0) return 100;

  const value = (scrollY / travel) * 100;
  return Math.min(100, Math.max(0, value));
}
