"use client";

import { useActionState, useMemo, useRef, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { updateProfileAction } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import type { ProfileLink } from "@/lib/types";

type ProfileEditorInitial = {
  username: string;
  showRealName: boolean;
  name: string;
  role: string;
  specialty: string;
  bio: string;
  location: string | null;
  pronouns: string | null;
  avatarImage: string | null;
  avatarGradient: string | null;
  avatarImageScale: number;
  avatarImageX: number;
  avatarImageY: number;
  links: ProfileLink[];
};

const GRADIENT_PRESETS = [
  { label: "Teal · Azure", value: "linear-gradient(135deg, #0d7d74, #4f8dff)" },
  { label: "Warm · Amber", value: "linear-gradient(135deg, #e36a2c, #ffd166)" },
  { label: "Violet · Magenta", value: "linear-gradient(135deg, #7c3aed, #ec4899)" },
  { label: "Emerald · Ink", value: "linear-gradient(135deg, #10b981, #0f172a)" },
  { label: "Sunset", value: "linear-gradient(135deg, #ff8f49, #ec4899, #7c3aed)" },
];

const MAX_IMAGE_BYTES = 180_000;

function parseImage(file: File, onLoad: (dataUrl: string | null) => void) {
  if (file.size > MAX_IMAGE_BYTES) {
    onLoad(null);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoad(typeof reader.result === "string" ? reader.result : null);
  reader.onerror = () => onLoad(null);
  reader.readAsDataURL(file);
}

export function ProfileEditor({ initial }: { initial: ProfileEditorInitial }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialActionState);
  const [avatarImage, setAvatarImage] = useState<string | null>(initial.avatarImage);
  const [avatarGradient, setAvatarGradient] = useState<string | null>(initial.avatarGradient);
  const [colorA, setColorA] = useState("#0d7d74");
  const [colorB, setColorB] = useState("#4f8dff");
  const [avatarImageScale, setAvatarImageScale] = useState(initial.avatarImageScale);
  const [avatarImageX, setAvatarImageX] = useState(initial.avatarImageX);
  const [avatarImageY, setAvatarImageY] = useState(initial.avatarImageY);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const linksValue = useMemo(
    () => initial.links.map((link) => `${link.label} | ${link.url}`).join("\n"),
    [initial.links],
  );

  return (
    <form action={formAction} className="form-grid">
      <div className="grid gap-3" style={{ justifyItems: "start" }}>
        <Avatar
          profile={{
            name: initial.name,
            avatarImage,
            avatarGradient,
            avatarImageScale,
            avatarImageX,
            avatarImageY,
            hue: null,
          }}
          size={78}
        />
        <div className="hero-actions">
          <label className="cta-secondary cta-compact" style={{ cursor: "pointer" }}>
            Upload image
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                parseImage(file, (dataUrl) => {
                  if (!dataUrl) {
                    setImageError("Image must be under 180 KB.");
                    return;
                  }
                  setImageError(null);
                  setAvatarImage(dataUrl);
                });
              }}
            />
          </label>
          <button
            type="button"
            className="cta-secondary cta-compact"
            onClick={() => {
              setAvatarImage(null);
              setAvatarImageScale(1);
              setAvatarImageX(50);
              setAvatarImageY(50);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Use gradient
          </button>
        </div>
        {imageError ? <p className="alert alert-error">{imageError}</p> : null}
        <div className="grid gap-2" style={{ width: "100%" }}>
          <span className="field-label"><span>Gradient preset</span></span>
          <div className="hero-actions">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className="cta-secondary cta-compact"
                style={{ background: preset.value, color: "white", borderColor: "transparent" }}
                onClick={() => setAvatarGradient(preset.value)}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              className="cta-secondary cta-compact"
              onClick={() => setAvatarGradient(null)}
            >
              Auto hue
            </button>
          </div>
          <div className="color-wheel-row">
            <label className="color-field">
              <span>Start</span>
              <input
                type="color"
                value={colorA}
                onChange={(event) => {
                  const next = event.target.value;
                  setColorA(next);
                  setAvatarGradient(`linear-gradient(135deg, ${next}, ${colorB})`);
                }}
              />
            </label>
            <label className="color-field">
              <span>End</span>
              <input
                type="color"
                value={colorB}
                onChange={(event) => {
                  const next = event.target.value;
                  setColorB(next);
                  setAvatarGradient(`linear-gradient(135deg, ${colorA}, ${next})`);
                }}
              />
            </label>
          </div>
        </div>
        {avatarImage ? (
          <div className="avatar-crop-controls">
            <span className="field-label"><span>Image crop and position</span></span>
            <Range label="Zoom" min={1} max={2.5} step={0.05} value={avatarImageScale} onChange={setAvatarImageScale} />
            <Range label="Horizontal" min={0} max={100} step={1} value={avatarImageX} onChange={setAvatarImageX} />
            <Range label="Vertical" min={0} max={100} step={1} value={avatarImageY} onChange={setAvatarImageY} />
          </div>
        ) : null}
      </div>
      <input type="hidden" name="avatarImage" value={avatarImage ?? ""} />
      <input type="hidden" name="avatarGradient" value={avatarGradient ?? ""} />
      <input type="hidden" name="avatarImageScale" value={String(avatarImageScale)} />
      <input type="hidden" name="avatarImageX" value={String(avatarImageX)} />
      <input type="hidden" name="avatarImageY" value={String(avatarImageY)} />
      <div className="form-grid form-grid-two">
        <Field label="Username" name="username" defaultValue={initial.username} error={state.fieldErrors?.username} />
        <Field label="Display name" name="name" defaultValue={initial.name} error={state.fieldErrors?.name} />
        <Field label="Role" name="role" defaultValue={initial.role} error={state.fieldErrors?.role} />
        <Field label="Specialty" name="specialty" defaultValue={initial.specialty} error={state.fieldErrors?.specialty} />
        <Field label="Location" name="location" defaultValue={initial.location ?? ""} error={state.fieldErrors?.location} />
        <Field label="Pronouns" name="pronouns" defaultValue={initial.pronouns ?? ""} error={state.fieldErrors?.pronouns} />
      </div>
      <label className="profile-visibility-toggle">
        <input type="checkbox" name="showRealName" defaultChecked={initial.showRealName} />
        <span>Show my display name publicly. If off, KenMatch shows my username instead.</span>
      </label>
      <label className="field-label">
        <span>Bio</span>
        <textarea className="field" rows={4} name="bio" defaultValue={initial.bio} />
        {state.fieldErrors?.bio ? <span className="text-xs text-red-500">{state.fieldErrors.bio}</span> : null}
      </label>
      <label className="field-label">
        <span>Links (one per line, format: Label | URL)</span>
        <textarea className="field" rows={4} name="links" defaultValue={linksValue} />
      </label>
      <div className="flex items-center justify-between gap-3">
        <button type="submit" className="cta-primary" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </button>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Changes are persisted immediately.
        </p>
      </div>
      {state.message ? (
        <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <input className="field" name={name} defaultValue={defaultValue} />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

function Range({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-field">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <strong>{label === "Zoom" ? `${value.toFixed(2)}x` : `${Math.round(value)}%`}</strong>
    </label>
  );
}
