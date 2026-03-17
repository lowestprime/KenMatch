import { cookies } from "next/headers";

import { getDefaultProfileId, listProfiles } from "@/lib/db";

export const ACTIVE_PROFILE_COOKIE = "kenmatch-profile";

export async function getSessionProfileId() {
  const store = await cookies();
  const requested = store.get(ACTIVE_PROFILE_COOKIE)?.value;
  const profiles = listProfiles();

  if (requested && profiles.some((profile) => profile.id === requested)) {
    return requested;
  }

  return getDefaultProfileId();
}