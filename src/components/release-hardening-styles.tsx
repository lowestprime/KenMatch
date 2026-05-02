export function ReleaseHardeningStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
:root{
  --color-background:#eadcff;
  --color-foreground:#12071f;
  --color-panel:#fbf7ff;
  --color-muted:#645670;
  --color-border:rgba(76,29,149,.22);
  --color-teal:#1d4ed8;
  --color-ember:#991b1b;
  --color-gold:#b08d1a;
  --mark-front:#03020a;
  --mark-front-muted-1:#1d4ed8;
  --mark-front-muted-2:#6d28d9;
  --danger:#991b1b;
  --danger-soft:rgba(153,27,27,.14);
}
html[data-theme="oled"],html[data-theme="dark"]{
  --color-background:#000;
  --color-foreground:#f8fafc;
  --color-panel:#000;
  --color-muted:#a99fba;
  --color-border:rgba(196,181,253,.16);
  --color-teal:#1d4ed8;
  --color-ember:#991b1b;
  --color-gold:#b08d1a;
  --mark-front:#f8fafc;
  --mark-front-muted-1:#1d4ed8;
  --mark-front-muted-2:#6d28d9;
  --danger:#dc2626;
  --danger-soft:rgba(153,27,27,.18);
}
html,body,.site-frame{background-color:var(--page)}
html[data-theme="oled"],html[data-theme="oled"] body,html[data-theme="oled"] .site-frame,html[data-theme="dark"],html[data-theme="dark"] body,html[data-theme="dark"] .site-frame{background-color:#000}
select.field{background-color:color-mix(in srgb,var(--panel-strong) 96%,transparent);color:var(--ink);accent-color:var(--accent-glow)}
select.field option{background:var(--panel-strong);color:var(--ink)}
html[data-theme="oled"] select.field option,html[data-theme="dark"] select.field option{background:#05030a;color:#f8fafc}
.site-nav,.search-results,.profile-menu-popover,textarea.field{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--accent-glow) 72%,transparent) transparent}
.site-nav::-webkit-scrollbar,.search-results::-webkit-scrollbar,.profile-menu-popover::-webkit-scrollbar,textarea.field::-webkit-scrollbar{width:.42rem;height:.42rem}
.site-nav::-webkit-scrollbar-thumb,.search-results::-webkit-scrollbar-thumb,.profile-menu-popover::-webkit-scrollbar-thumb,textarea.field::-webkit-scrollbar-thumb{border-radius:999px;background:linear-gradient(180deg,var(--accent-glow),var(--accent-blue))}
.filter-chip{display:inline-flex;align-items:center;justify-content:center;border:1px solid color-mix(in srgb,var(--accent-glow) 22%,var(--line));border-radius:.8rem;background:color-mix(in srgb,var(--panel-strong) 78%,transparent);color:var(--ink-muted);font-weight:800;font-size:.84rem;padding:.48rem .72rem;transition:transform 160ms ease,border-color 160ms ease,box-shadow 160ms ease,background 160ms ease,color 160ms ease}
.filter-chip:hover,.filter-chip.is-active{border-color:color-mix(in srgb,var(--accent-glow) 72%,var(--line));background:color-mix(in srgb,var(--accent-glow) 12%,transparent);color:var(--accent-strong);box-shadow:0 10px 24px -18px var(--accent-glow);transform:translateY(-1px)}
.saved-library-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.75rem;align-items:end}.saved-library-search{min-width:min(100%,22rem)}
.discussion-save-button:disabled,.discussion-vote-button:disabled{cursor:not-allowed;opacity:.58;transform:none}.discussion-save-button:hover:not(:disabled),.discussion-vote-button:hover:not(:disabled){transform:translateY(-1px);border-color:color-mix(in srgb,var(--accent-glow) 72%,var(--line))}
@media(max-width:720px){.saved-library-controls{grid-template-columns:1fr}.filter-chip{flex:1 1 auto}}
@media(prefers-reduced-motion:no-preference){.interactive-surface,.discussion-post-card,.saved-community-card,.category-visual-form{transition:transform 180ms cubic-bezier(.2,.8,.2,1),border-color 180ms ease,box-shadow 180ms ease,background 180ms ease}.saved-community-card:hover,.category-visual-form:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--accent-glow) 44%,var(--line));box-shadow:0 18px 42px -32px var(--accent-glow)}}
`,
      }}
    />
  );
}
