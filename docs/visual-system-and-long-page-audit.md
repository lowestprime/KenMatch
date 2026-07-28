# Visual System and Long-Page Audit

## Scope

This document records the July 28, 2026 evidence-led refinement of KenMatch's Light/OLED system, typography, long reading routes, and admin audit history. It is deliberately limited to the application shell and content surfaces. Existing brand, category, favicon, and social-preview assets were preserved because the baseline did not demonstrate an asset defect.

## Baseline evidence

Browser screenshots were captured before editing:

- `output/playwright/baseline-faq-oled-768.png`
- `output/playwright/baseline-about-light-390.png`
- `output/playwright/baseline-kens-light-768.png`
- `output/playwright/baseline-admin-audit-light-1366.png`
- `output/playwright/lifecycle-oled-1366.png`
- `output/playwright/lifecycle-light-1366.png`
- `output/playwright/lifecycle-oled-320.png`

The baseline exposed three concrete problems:

1. `src/app/globals.css`, `ReleasePolishStyles`, and `ReleaseHardeningStyles` each owned overlapping theme tokens. The last inline style won, turning Light into a lavender/pastel field (`#eadcff`, `#d6bfff`, and `#f4eaff`) regardless of the global palette.
2. Twenty-five typography rules used viewport units inside `clamp()`. The 390px About heading computed to 54.6px, while several compact cards inherited oversized responsive type.
3. `.admin-audit-list` had a fixed maximum height and shrinking grid tracks, while every `.audit-card` was forced to `overflow: hidden`. Audit rows rendered at approximately 18px client height despite 66px of content, and metadata was silently cut to 700 display characters.

Baseline route sweeps found no document-level horizontal overflow, but the audit list was an unnecessary nested vertical scroller. The 390px About page was 11,286px tall and the signed-in desktop Admin page was 7,105px tall.

## Token ownership

`src/app/globals.css` is now the only owner of semantic color tokens. Inline style components retain component structure only.

### Light

- Page: `#f1f3f7`
- Alternate page: `#e7ebf3`
- Panel: `rgba(250, 251, 254, 0.92)`
- Surface: `#f7f8fc`
- Ink: `#101522`
- Muted: `#596377`
- Accents: blue `#315dff`, purple `#6746d9`, gold `#946600`, red `#c43e5b`

Light uses one restrained cool-neutral linear wash. It does not use a pure-white page field, cream/beige, pastel lavender, radial decoration, or stacked competing gradients.

### OLED

OLED retains a true `#000000` page base, near-black panels, high-contrast cool text, and blue/purple/gold/red accents. Its background is one shallow top-to-black linear band. Generic panels no longer apply blur; translucency remains limited to the sticky header, footer, search overlay, and mobile backdrop where layer separation is functional.

## Typography and layout

- Font sizes use fixed rem values selected at explicit breakpoints. No `font-size` declaration scales directly with viewport width.
- Generic headings, hero headings, Ken titles, metrics, navigation, and compact discussion titles have bounded sizes.
- Panels, cards, fields, and audit records keep `min-width: 0` and wrap only where long identifiers or prose require it.
- Brand and category assets were not regenerated or replaced.

## Long reading routes

The following editorial routes opt into `.long-reading-route`:

- `/about`
- `/economics`
- `/faq`
- `/glossary`
- `/governance`

They use a 76rem readable maximum width, one document scroll, consistent anchor offsets, and a thin right-edge progress indicator only when the actual content height exceeds both 1,800px and 2.25 viewports. The indicator:

- is absent from task-oriented routes such as `/kens`, `/submit`, and `/admin`;
- exposes a named ARIA progressbar with numeric and text values;
- updates through one animation-frame-throttled scroll listener;
- disables its transition for reduced motion;
- remains legible in forced-colors mode; and
- is removed from print output.

## Admin audit history

Audit history now uses a stable server query ordered by `createdAt DESC, id DESC`, with:

- action, text, and metadata search;
- action selection;
- 10, 25, or 50 rows per page;
- durable next/previous links that preserve unrelated admin filters;
- a database index over `(action, createdAt)`;
- full event detail and metadata storage;
- server-boundary email, bearer-token, and secret-key redaction;
- bounded previews for exceptionally long event bodies, with complete expandable and copyable text;
- expandable pretty-printed metadata;
- a copy control; and
- content-sized rows with no internal audit-list scrollbar.

The first post-change audit rows measured 72px client and scroll height with `overflow: visible`. Expanded metadata grew its row to 268px with matching client and scroll height. A 10-row browser run advanced from page 1 to page 2 of 3 without overlap or duplicated layout state.

## Post-change browser evidence

Screenshots:

- `output/playwright/final-about-light-390.png`
- `output/playwright/final-kens-light-768.png`
- `output/playwright/final-faq-oled-768.png`
- `output/playwright/final-admin-audit-light-1366.png`
- `output/playwright/final-admin-audit-metadata-expanded-1366.png`

Computed outcomes:

- Light tokens resolve to the documented cool-neutral values.
- The 390px About heading resolves to 42.4px instead of 54.6px.
- Reading progress resolved to 56% at the midpoint of the About document and was absent from the taller Admin route.
- All 14 audited routes at 390px Light and all 14 at 1366px OLED had `scrollWidth === clientWidth`.
- The only non-textarea nested vertical scroller was `.admin-dense-list`, the intentionally bounded account-management collection. Audit history uses document scrolling.
- Browser console checks returned zero errors and zero warnings.

The browser artifacts are local validation evidence and remain under the repository's ignored `output/playwright/` directory.
