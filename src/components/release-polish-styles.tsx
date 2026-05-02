export function ReleasePolishStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
:root{
  --accent-strong:#5b21b6;
  --accent-glow:#6d28d9;
  --accent-warm:#9f1239;
  --accent-gold:#b08d1a;
  --accent-blue:#1d4ed8;
  --accent-purple:#6d28d9;
  --accent-red:#991b1b;
  --success:#5b21b6;
  --success-soft:rgba(91,33,182,.14);
  --page:#eadcff;
  --page-alt:#d6bfff;
  --panel:rgba(251,247,255,.9);
  --panel-strong:rgba(255,252,255,.98);
  --surface:#f4eaff;
  --line:rgba(76,29,149,.22);
  --line-soft:rgba(76,29,149,.11);
  --ink:#12071f;
  --ink-muted:#3f3150;
  --muted:#645670;
  --rainbow-border:linear-gradient(115deg,#1d4ed8 0%,#4c1d95 28%,#b08d1a 55%,#991b1b 78%,#6d28d9 100%);
  --brand-mark-shell:#6d28d9;
  --brand-mark-foreground:#03020a;
  --brand-dot-one:#1d4ed8;
  --brand-dot-two:#6d28d9;
  --brand-dot-three:#b08d1a;
  --brand-dot-four:#991b1b;
}
html[data-theme="oled"],html[data-theme="dark"]{
  --accent-strong:#8b5cf6;
  --accent-glow:#6d28d9;
  --accent-warm:#991b1b;
  --accent-gold:#b08d1a;
  --accent-blue:#1d4ed8;
  --accent-purple:#8b5cf6;
  --accent-red:#991b1b;
  --success:#8b5cf6;
  --success-soft:rgba(139,92,246,.16);
  --panel:rgba(0,0,0,.94);
  --panel-strong:rgba(3,2,9,.98);
  --surface:#020106;
  --line:rgba(196,181,253,.16);
  --line-soft:rgba(196,181,253,.07);
  --ink:#f8fafc;
  --ink-muted:#d8d2e8;
  --muted:#a99fba;
  --rainbow-border:linear-gradient(115deg,#1d4ed8 0%,#4c1d95 27%,#b08d1a 54%,#991b1b 78%,#6d28d9 100%);
  --brand-mark-shell:#000;
  --brand-mark-foreground:#f8fafc;
  --brand-dot-one:#1d4ed8;
  --brand-dot-two:#6d28d9;
  --brand-dot-three:#b08d1a;
  --brand-dot-four:#991b1b;
}
html{scrollbar-color:color-mix(in srgb,var(--accent-glow) 76%,#000) color-mix(in srgb,var(--surface) 80%,transparent)}
::-webkit-scrollbar{width:.72rem;height:.58rem}
::-webkit-scrollbar-track{background:color-mix(in srgb,var(--surface) 84%,transparent)}
::-webkit-scrollbar-thumb{border:2px solid color-mix(in srgb,var(--surface) 84%,transparent);border-radius:999px;background:linear-gradient(180deg,var(--accent-glow),var(--accent-blue))}
::selection{background:color-mix(in srgb,var(--accent-glow) 38%,transparent);color:var(--ink)}
body{background:radial-gradient(circle at 10% -12%,color-mix(in srgb,var(--accent-glow) 24%,transparent),transparent 34%),radial-gradient(circle at 82% -10%,color-mix(in srgb,var(--accent-red) 14%,transparent),transparent 30%),radial-gradient(circle at 66% 18%,color-mix(in srgb,var(--accent-gold) 13%,transparent),transparent 28%),linear-gradient(180deg,var(--page),var(--page-alt))}
html[data-theme="oled"] body,html[data-theme="dark"] body{background:radial-gradient(circle at 14% -9%,color-mix(in srgb,var(--accent-glow) 18%,transparent),transparent 35%),radial-gradient(circle at 88% -8%,color-mix(in srgb,var(--accent-red) 12%,transparent),transparent 32%),radial-gradient(circle at 60% 20%,color-mix(in srgb,var(--accent-gold) 7%,transparent),transparent 30%),#000}
.site-main{padding-block:clamp(.7rem,1.8vw,1.1rem) clamp(2rem,4vw,3rem)}
.page-stack{gap:clamp(.7rem,1.4vw,1.1rem)}
.panel{padding:clamp(.85rem,1.45vw,1.3rem)}
.site-header-inner{max-width:min(98rem,100vw);padding-inline:clamp(.45rem,1.2vw,.95rem)}
.site-brand-row{grid-template-columns:minmax(15.5rem,auto) minmax(0,1fr) auto;gap:clamp(.55rem,1.1vw,1rem)}
.site-brand{gap:.72rem}.site-brand strong{font-size:clamp(1.05rem,1.35vw,1.28rem)}.site-brand span span{font-size:clamp(.72rem,.86vw,.82rem)}
.brand-mark{width:clamp(2.65rem,2.35vw,3.15rem);height:clamp(2.65rem,2.35vw,3.15rem);filter:drop-shadow(0 0 .7rem color-mix(in srgb,var(--accent-glow) 34%,transparent))}
.kenmatch-k-auto path,.kenmatch-k-light path,.kenmatch-k-oled path,.kenmatch-k-dark path{fill:var(--brand-mark-foreground)!important}
.kenmatch-k-auto circle:nth-of-type(1),.kenmatch-k-light circle:nth-of-type(1),.kenmatch-k-oled circle:nth-of-type(1),.kenmatch-k-dark circle:nth-of-type(1){fill:var(--brand-dot-one)!important}
.kenmatch-k-auto circle:nth-of-type(2),.kenmatch-k-light circle:nth-of-type(2),.kenmatch-k-oled circle:nth-of-type(2),.kenmatch-k-dark circle:nth-of-type(2){fill:var(--brand-dot-two)!important}
.kenmatch-k-auto circle:nth-of-type(3),.kenmatch-k-light circle:nth-of-type(3),.kenmatch-k-oled circle:nth-of-type(3),.kenmatch-k-dark circle:nth-of-type(3){fill:var(--brand-dot-three)!important}
.site-nav{justify-content:flex-start;min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;padding:.18rem .64rem .5rem;scroll-padding-inline:1rem;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--accent-glow) 88%,transparent) transparent;mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - .9rem),transparent 100%)}
.site-nav::-webkit-scrollbar{height:.42rem}.site-nav::-webkit-scrollbar-track{background:color-mix(in srgb,var(--accent-glow) 7%,transparent);border-radius:999px}.site-nav::-webkit-scrollbar-thumb{border-radius:999px;background:var(--rainbow-border)}
.nav-pill{white-space:nowrap;flex:0 0 auto;min-height:2.2rem;padding:.56rem .82rem;font-size:clamp(.86rem,.92vw,.98rem);border-radius:.84rem}
.nav-pill[data-active="true"]{box-shadow:0 .5rem 1.5rem -.95rem var(--accent-glow)}
.nav-pill,.cta-secondary,.footer-badge,.field,.theme-toggle,.search-command-trigger,.search-trigger,.mobile-nav-trigger{border-color:color-mix(in srgb,var(--accent-glow) 20%,var(--line))}
.nav-pill:hover,.cta-secondary:hover,.footer-badge:hover,.field:focus,.search-command-trigger:hover,.search-trigger:hover,.theme-toggle:hover{border-color:color-mix(in srgb,var(--accent-glow) 72%,var(--line));color:var(--accent-strong);box-shadow:0 0 0 1px color-mix(in srgb,var(--accent-glow) 24%,transparent),0 12px 28px -20px var(--accent-glow)}
.cta-primary,html[data-theme="oled"] .nav-pill[data-active="true"],html[data-theme="dark"] .nav-pill[data-active="true"]{background:linear-gradient(135deg,#5b21b6,#6d28d9 56%,#4c1d95);color:#fff}
.theme-toggle-thumb{background:linear-gradient(135deg,var(--accent-red),var(--accent-gold));box-shadow:0 4px 10px color-mix(in srgb,var(--accent-red) 35%,transparent)}
.panel,.task-card,.metric-card,.stat-card,.flow-card,.audit-card,.protocol-card,.policy-row{position:relative;overflow:hidden}
.panel:hover,.task-card:hover,.metric-card:hover,.stat-card:hover,.flow-card:hover,.audit-card:hover,.protocol-card:hover,.policy-row:hover{border-color:color-mix(in srgb,var(--accent-glow) 44%,var(--line));box-shadow:0 0 0 1px color-mix(in srgb,var(--accent-glow) 22%,transparent),0 22px 52px -34px var(--accent-glow)}
.task-card:hover,.protocol-card:hover,.policy-row:hover{transform:translateY(-2px)}
.hero-panel::before{background:color-mix(in srgb,var(--accent-glow) 15%,transparent)}.hero-panel::after{background:color-mix(in srgb,var(--accent-red) 11%,transparent)}
.about-hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(18rem,.9fr);align-items:end;gap:clamp(1rem,2vw,2.25rem);min-height:auto}.about-hero h1{font-size:clamp(3rem,6.4vw,6.8rem);line-height:.96;max-width:10.5ch}.about-hero-copy{display:grid;gap:clamp(.7rem,1.3vw,1rem)}.about-hero-summary{align-self:end;display:grid;gap:.65rem}.about-hero-summary>div{background:color-mix(in srgb,var(--surface) 68%,transparent);border:1px solid var(--line);border-radius:.9rem;padding:.82rem .9rem}
select.field{appearance:auto;color:var(--accent-strong);background:linear-gradient(180deg,color-mix(in srgb,var(--panel-strong) 94%,transparent),color-mix(in srgb,var(--surface) 92%,transparent));scrollbar-width:thin;scrollbar-color:var(--accent-glow) var(--surface)}
select.field option{background:color-mix(in srgb,var(--panel-strong) 96%,#000 4%);color:var(--ink)}html[data-theme="oled"] select.field option,html[data-theme="dark"] select.field option{background:#08050f;color:#f8fafc}.field:focus,select.field:focus{outline:0;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent-glow) 22%,transparent)}
.category-symbol{filter:drop-shadow(0 .6rem 1.4rem color-mix(in srgb,var(--symbol-glow) 20%,transparent))}.category-symbol-shell{fill:var(--symbol-background);stroke:color-mix(in srgb,var(--symbol-primary) 72%,transparent);stroke-width:2}.category-symbol-motif{stroke:var(--symbol-primary);stroke-width:4;stroke-linecap:round;stroke-linejoin:round;fill:none}.category-symbol-horizon,.category-symbol-lane{stroke:var(--symbol-tertiary);stroke-width:4;stroke-linecap:round;fill:none}.category-symbol-status{stroke:var(--symbol-secondary);stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;fill:color-mix(in srgb,var(--symbol-background) 80%,#000)}
.profile-menu{position:relative;display:inline-flex;align-items:center}.profile-menu-trigger{display:inline-flex;align-items:center;gap:.48rem;min-width:0;border:1px solid var(--line);border-radius:999px;background:color-mix(in srgb,var(--panel-strong) 86%,transparent);color:var(--ink);padding:.24rem .38rem;cursor:pointer;transition:border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease}.profile-menu-trigger:hover,.profile-menu-trigger[aria-expanded="true"]{border-color:color-mix(in srgb,var(--accent-glow) 70%,var(--line));box-shadow:0 0 0 1px color-mix(in srgb,var(--accent-glow) 24%,transparent);transform:translateY(-1px)}.profile-menu-meta{display:grid;gap:.02rem;min-width:0;max-width:12rem;text-align:left}.profile-menu-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800;line-height:1.1}.profile-menu-caption{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:.72rem;line-height:1.15}.profile-menu-chevron{color:var(--muted);flex:none}.profile-menu-popover{position:absolute;right:0;top:calc(100% + .5rem);z-index:120;display:grid;gap:.35rem;width:min(18rem,calc(100vw - 1.5rem));border:1px solid color-mix(in srgb,var(--accent-glow) 36%,var(--line));border-radius:1rem;background:color-mix(in srgb,var(--panel-strong) 96%,transparent);box-shadow:0 24px 70px rgba(0,0,0,.34);padding:.48rem}.profile-menu-header{display:flex;align-items:center;gap:.65rem;padding:.45rem;border-bottom:1px solid var(--line-soft)}.profile-menu-actions{display:grid;gap:.28rem}.profile-menu-item{display:flex;align-items:center;justify-content:space-between;border:1px solid transparent;border-radius:.72rem;background:transparent;color:var(--ink);padding:.62rem .7rem;font-weight:700;text-align:left}.profile-menu-item:hover{border-color:color-mix(in srgb,var(--accent-glow) 46%,var(--line));background:color-mix(in srgb,var(--accent-glow) 10%,transparent);color:var(--accent-strong)}.profile-menu-item.is-danger:hover{border-color:color-mix(in srgb,var(--danger) 50%,var(--line));color:var(--danger)}.profile-menu-item:disabled{opacity:.55;cursor:wait}.viewer-inline-card,.viewer-inline-actions{display:none!important}
.protocol-panel{display:grid;gap:1.25rem}.lifecycle-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:.85rem}.protocol-card,.policy-row{border:1px solid var(--line);border-radius:1.1rem;background:color-mix(in srgb,var(--surface) 72%,transparent);padding:1rem;transition:border-color 160ms ease,box-shadow 160ms ease,transform 160ms ease}.protocol-card h3,.policy-row strong{display:block;color:var(--ink);font-family:var(--font-display);font-weight:800}.protocol-card p,.policy-row p{margin-top:.42rem;color:var(--muted);font-size:.88rem;line-height:1.55}.protocol-card small{display:block;margin-top:.7rem;color:var(--accent-strong);font-weight:700;line-height:1.5}.policy-list{display:grid;gap:.7rem}.policy-row{display:flex;align-items:center;justify-content:space-between;gap:1rem}.policy-row>span{display:grid;gap:.2rem;min-width:6rem;text-align:right;color:var(--accent-strong);font-weight:900}.policy-row em{display:block;color:var(--muted);font-style:normal;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em}.compact-policy-list .policy-row{display:grid}.criteria-list{display:grid;gap:.65rem;counter-reset:criteria}.criteria-list li{list-style:none;position:relative;border:1px solid var(--line);border-radius:1rem;background:color-mix(in srgb,var(--surface) 70%,transparent);padding:.82rem .9rem .82rem 2.7rem;color:var(--muted);font-size:.9rem;line-height:1.55}.criteria-list li::before{counter-increment:criteria;content:counter(criteria);position:absolute;left:.75rem;top:.78rem;display:grid;place-items:center;width:1.35rem;height:1.35rem;border-radius:999px;background:linear-gradient(135deg,#5b21b6,#7c3aed);color:#fff;font-size:.72rem;font-weight:900}.search-trigger,.search-command-trigger{background:color-mix(in srgb,var(--panel-strong) 84%,transparent);color:var(--ink-muted)}
.ecosystem-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:.85rem}.ecosystem-card{border:1px solid var(--line);border-radius:1rem;background:color-mix(in srgb,var(--surface) 74%,transparent);padding:1rem;display:grid;gap:.45rem}.ecosystem-card strong{font-family:var(--font-display);font-size:1.05rem}.ecosystem-card p{color:var(--muted);font-size:.92rem;line-height:1.55}.discussion-thread-preview{display:grid;gap:.65rem}.discussion-thread-preview article{border:1px solid var(--line);border-radius:1rem;background:color-mix(in srgb,var(--panel-strong) 72%,transparent);padding:.9rem}.discussion-thread-preview article:hover{border-color:color-mix(in srgb,var(--accent-glow) 45%,var(--line))}
@media(max-width:1180px){.site-brand-row{grid-template-columns:minmax(12rem,.68fr) minmax(0,1fr) auto}.profile-menu-meta{display:none}}
@media(max-width:900px){.about-hero{grid-template-columns:1fr}.about-hero h1{font-size:clamp(2.7rem,12vw,5.4rem);max-width:11ch}.about-hero-summary{align-self:auto}.site-brand-row{grid-template-columns:minmax(10rem,1fr) auto}.site-nav{grid-column:1/-1;order:3;padding-left:.2rem;padding-right:.6rem;mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - .85rem),transparent 100%)}.site-utility-row{grid-column:2}.search-command-trigger,.search-trigger{max-width:8rem}.policy-row{display:grid}.policy-row>span{text-align:left}}
@media(max-width:560px){.site-brand span span{max-width:13rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.brand-mark{width:2.55rem;height:2.55rem}.lifecycle-grid{grid-template-columns:1fr}.about-hero h1{font-size:clamp(2.45rem,14vw,4.3rem)}}
@media(prefers-reduced-motion:no-preference){.panel,.task-card,.nav-pill,.cta-primary,.cta-secondary,.footer-badge,.profile-menu-trigger{transition:transform 180ms cubic-bezier(.2,.8,.2,1),border-color 180ms ease,box-shadow 180ms ease,background 180ms ease}.ambient-a{animation:kenmatchFloat 14s ease-in-out infinite}.ambient-b{animation:kenmatchFloat 18s ease-in-out infinite reverse}@keyframes kenmatchFloat{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(1.5rem,-.8rem,0) scale(1.04)}}}
`,
      }}
    />
  );
}
