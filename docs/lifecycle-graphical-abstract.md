# Ken lifecycle graphical abstract

## Canonical model

`src/lib/allocation-policy.ts` is the only lifecycle policy source. It defines:

- Draft → Intake review → Public signal → Board approval → Monitored run → Checkpoint review → Public delivery → Post-run audit.
- pulse versus scarce quadratic voice;
- category-local Days, Weeks, and Months lane assignment;
- sponsor support as capacity, never rank or checkpoint authority;
- continue, redirect, pause, and block checkpoint decisions;
- complete, partial, and early delivery;
- contributor credit and post-run audit.

`src/components/ken-lifecycle-map.tsx` consumes those constants directly. Overview uses the explanatory view, Governance uses the compact decision-path view, and Ken detail maps the persisted task stage to completed/current/upcoming progression.

## Accessibility contract

- Semantic section, heading, ordered list, buttons, article, and printable ordered-list structure.
- Every stage button exposes the full stage summary and public gate in its accessible name.
- Arrow keys move between stages; Home and End move to the first and last stage.
- The selected stage uses `aria-expanded`; persisted progress uses `aria-current="step"`.
- Complete, Current, Blocked, and Upcoming are visible text, so color is never the only state indicator.
- All mechanism details are available on selection and never require hover.
- The screen-reader narrative names all eight stages and the money/rank boundary.
- Forced-color rules preserve native canvas, text, highlight, borders, and focus indication.
- Reduced-motion media removes stage transition animation.
- At 320 px the control rail becomes a stable two-column grid with no horizontal overflow.
- Print media replaces the interactive rail with all eight stage summaries and gates in a static two-column narrative.

## Reproducible validation

Run:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Local browser evidence was captured against `http://127.0.0.1:3100` on 2026-07-28:

| Check | Result |
| --- | --- |
| OLED, 1366 × 900 | Eight-stage rail, selected detail, and mechanism callout rendered |
| Light, 1366 × 900 | Text, spectrum states, keylines, and selected state remained legible |
| OLED, 320 × 800 | `document.scrollWidth === window.innerWidth`; lifecycle client and scroll widths matched |
| Keyboard | Right Arrow moved focus and expanded state from Draft to Intake review |
| Reduced motion | Media query matched and stage transition duration computed to `0s` |
| Forced colors | Media query matched; selected stage retained a solid system-highlight outline and text labels |
| Print | Interactive rail/detail computed to `display: none`; full print narrative computed to `display: grid` |
| PDF | Browser generated `output/playwright/lifecycle-print-home.pdf` successfully |
| Ken detail | Running Ken showed Draft through Board approval as Complete, Monitored run as Current, and later stages as Upcoming |
| Console | Zero browser console errors |

The local screenshots and PDF are validation artifacts under `output/playwright/` and are intentionally excluded from source control.
