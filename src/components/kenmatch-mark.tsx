export function KenMatchMark({
  className = "",
  variant = "auto",
}: {
  className?: string;
  variant?: "auto" | "light" | "dark" | "oled";
}) {
  const svgClassName = [className, "kenmatch-mark-themed", `kenmatch-mark-${variant}`].filter(Boolean).join(" ");

  return (
    <span
      aria-hidden="true"
      className={svgClassName}
      data-variant={variant}
      style={{
        aspectRatio: "1 / 1",
        display: "inline-grid",
        lineHeight: 0,
        overflow: "visible",
        placeItems: "center",
      }}
    >
      <style>{`
        .kenmatch-mark-themed .kenmatch-mark-image{
          display:block;
          grid-area:1 / 1;
          width:100%;
          height:100%;
          object-fit:contain;
          pointer-events:none;
          user-select:none;
        }
        .kenmatch-mark-themed .kenmatch-mark-image-light{display:none;}
        .kenmatch-mark-themed .kenmatch-mark-image-dark{display:block;}
        html[data-theme="light"] .kenmatch-mark-auto .kenmatch-mark-image-light,
        .kenmatch-mark-light .kenmatch-mark-image-light{display:block;}
        html[data-theme="light"] .kenmatch-mark-auto .kenmatch-mark-image-dark,
        .kenmatch-mark-light .kenmatch-mark-image-dark{display:none;}
        .kenmatch-mark-dark .kenmatch-mark-image-light,
        .kenmatch-mark-oled .kenmatch-mark-image-light{display:none;}
        .kenmatch-mark-dark .kenmatch-mark-image-dark,
        .kenmatch-mark-oled .kenmatch-mark-image-dark{display:block;}
      `}</style>
      <img className="kenmatch-mark-image kenmatch-mark-image-light" src="/icon-light.svg" alt="" draggable={false} decoding="async" />
      <img className="kenmatch-mark-image kenmatch-mark-image-dark" src="/icon-dark.svg" alt="" draggable={false} decoding="async" />
    </span>
  );
}
