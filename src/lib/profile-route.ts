export function profilePath(profile: { id: string; username?: string | null }) {
  const slug = profile.username?.trim() || profile.id;
  return `/people/${encodeURIComponent(slug)}`;
}
