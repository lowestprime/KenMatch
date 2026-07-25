# Ken category icon system

## Purpose

The category icon system provides a recognizable visual identity for every Ken category while preserving runtime task state. The system is vector-native, theme-aware, accessible, and aligned with the finalized KenMatch product mark.

## Design grammar

- A 96 × 96 optical grid.
- A thin five-stop KenMatch spectrum perimeter.
- A true-black OLED or true-white light surface.
- A high-contrast semantic glyph drawn with a consistent 3-unit stroke.
- A restrained category-gradient accent drawn with a 1.9-unit stroke.
- A small radial “Ken jewel” placed at the motif’s semantic junction.
- A compact upper-right stage lens and five-segment allocation rail on card/detail variants.
- Inline variants omit runtime indicators to preserve clarity at small sizes.

## Static and live assets

`public/category-icons/{dark,light}/*.svg` are category-only reference exports for documentation and collateral. `src/components/ken-visual.tsx` renders the same core identity inline and adds task-specific stage and allocation state.

## Accessibility

Essential category geometry uses white on OLED and near-black on light surfaces. Color is supplemental. Stage uses unique glyph shapes; allocation uses segment count. The component keeps its accessible label and supports forced-colors mode.

## Runtime overrides

Database-backed category palette overrides continue to set the existing CSS variables. Stored `customSvg` text remains inert and must not be rendered without a dedicated sanitizer and security review.

## Categories

- Science & Health: double helix.
- Open Tools: terminal.
- Research Synthesis: convergent evidence graph.
- Engineering Systems: routed modules.
- Safety & Evaluation: verified shield.
- Frontier Creative: controlled starburst.
- Fallback: faceted prism.
