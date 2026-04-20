"use client";

import { useActionState, useMemo, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { moderateProfileAction, updateAccountRoleAction } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import type { AccountRecord, ProfileRecord, SystemRole } from "@/lib/types";

type AdminAccountInput = {
  accounts: AccountRecord[];
  profiles: ProfileRecord[];
  currentAccountId: string;
};

const ROLES: SystemRole[] = ["contributor", "moderator", "admin", "owner"];
const MODERATION_STATES = ["active", "restricted", "suspended"] as const;

export function AdminAccounts({ accounts, profiles, currentAccountId }: AdminAccountInput) {
  const [roleState, roleAction, rolePending] = useActionState(updateAccountRoleAction, initialActionState);
  const [modState, modAction, modPending] = useActionState(moderateProfileAction, initialActionState);
  const [query, setQuery] = useState("");
  const normalized = query.toLowerCase().trim();
  const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const rows = accounts
    .map((account) => ({ account, profile: profilesById.get(account.profileId) }))
    .filter(({ account, profile }) => {
      if (!normalized) return true;
      return (
        account.email.toLowerCase().includes(normalized) ||
        (profile?.name.toLowerCase().includes(normalized) ?? false) ||
        (profile?.role.toLowerCase().includes(normalized) ?? false)
      );
    });

  return (
    <div className="grid gap-3">
      <label className="field-label">
        <span>Filter</span>
        <input
          className="field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email…"
        />
      </label>
      {roleState.message ? (
        <p className={`alert ${roleState.status === "error" ? "alert-error" : "alert-success"}`}>{roleState.message}</p>
      ) : null}
      {modState.message ? (
        <p className={`alert ${modState.status === "error" ? "alert-error" : "alert-success"}`}>{modState.message}</p>
      ) : null}
      <div className="admin-grid-table">
        {rows.map(({ account, profile }) => (
          <article key={account.id} className="admin-row">
            <div className="flex items-center gap-3">
              {profile ? (
                <Avatar
                  profile={{ name: profile.name, hue: profile.avatarHue, avatarImage: profile.avatarImage, avatarGradient: profile.avatarGradient }}
                  size={44}
                />
              ) : null}
              <div>
                <strong>{profile?.name ?? account.email}</strong>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                  {account.email} · {profile?.role ?? "—"}
                </p>
              </div>
            </div>
            <form action={roleAction} className="flex items-center gap-2">
              <input type="hidden" name="accountId" value={account.id} />
              <select
                className="field"
                name="role"
                defaultValue={account.systemRole}
                disabled={account.id === currentAccountId}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="cta-secondary cta-compact"
                disabled={rolePending || account.id === currentAccountId}
              >
                Save
              </button>
            </form>
            {profile ? (
              <form action={modAction} className="flex items-center gap-2">
                <input type="hidden" name="profileId" value={profile.id} />
                <select
                  className="field"
                  name="status"
                  defaultValue={profile.moderationStatus ?? "active"}
                >
                  {MODERATION_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <button type="submit" className="cta-secondary cta-compact" disabled={modPending}>
                  Update
                </button>
              </form>
            ) : null}
            <span className={`role-badge is-${account.systemRole}`}>{account.systemRole}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
