import type { ProfileRecord, ProfileSummary } from "@/lib/types";

type AvatarInput = {
  name: string;
  avatarImage?: string | null;
  avatarGradient?: string | null;
  avatarImageScale?: number | null;
  avatarImageX?: number | null;
  avatarImageY?: number | null;
  hue?: number | null;
};

type AvatarProfileLike =
  | AvatarInput
  | Pick<ProfileSummary, "name" | "avatarHue" | "avatarImage" | "avatarGradient" | "avatarImageScale" | "avatarImageX" | "avatarImageY">
  | Pick<ProfileRecord, "name" | "avatarHue" | "avatarImage" | "avatarGradient" | "avatarImageScale" | "avatarImageX" | "avatarImageY">;

function getInitials(name: string): string {
  if (!name) return "K";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "K";
}

function gradientFromHue(hue: number): string {
  const hue1 = hue;
  const hue2 = (hue + 42) % 360;
  const hue3 = (hue + 84) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 72% 54%), hsl(${hue2} 68% 48%) 55%, hsl(${hue3} 74% 58%))`;
}

function normalizeInput(profile: AvatarProfileLike): AvatarInput {
  if ("avatarHue" in profile) {
    return {
      name: profile.name,
      avatarImage: profile.avatarImage ?? null,
      avatarGradient: profile.avatarGradient ?? null,
      avatarImageScale: profile.avatarImageScale ?? 1,
      avatarImageX: profile.avatarImageX ?? 50,
      avatarImageY: profile.avatarImageY ?? 50,
      hue: profile.avatarHue ?? null,
    };
  }
  return {
    name: profile.name,
    avatarImage: profile.avatarImage ?? null,
    avatarGradient: profile.avatarGradient ?? null,
    avatarImageScale: profile.avatarImageScale ?? null,
    avatarImageX: profile.avatarImageX ?? null,
    avatarImageY: profile.avatarImageY ?? null,
    hue: profile.hue ?? null,
  };
}

export function Avatar({
  profile,
  size = 40,
  className = "",
}: {
  profile: AvatarProfileLike;
  size?: number;
  className?: string;
}) {
  const data = normalizeInput(profile);
  const hue = typeof data.hue === "number" ? data.hue : 204;
  const background = data.avatarGradient ?? gradientFromHue(hue);
  const initials = getInitials(data.name);
  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(12, Math.round(size * 0.4)),
  };
  if (!data.avatarImage) {
    style.background = background;
  }
  const imageStyle: React.CSSProperties = {
    objectPosition: `${data.avatarImageX ?? 50}% ${data.avatarImageY ?? 50}%`,
    transform: `scale(${Math.max(1, Math.min(data.avatarImageScale ?? 1, 2.5))})`,
  };
  return (
    <span
      className={`avatar ${className}`.trim()}
      style={style}
      role="img"
      aria-label={`Avatar for ${data.name}`}
    >
      {data.avatarImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.avatarImage} alt="" style={imageStyle} />
      ) : (
        <span className="avatar-initials" aria-hidden="true">
          {initials}
        </span>
      )}
    </span>
  );
}
