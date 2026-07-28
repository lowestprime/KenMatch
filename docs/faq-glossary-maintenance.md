# FAQ, Glossary, and Product-Truth Maintenance

## Purpose

The FAQ answers public questions. The glossary defines operational terms. The product-truth matrix states whether a capability is operational, demonstrated with sandbox data, externally unconfigured, proposed, or intentionally out of scope. These surfaces must agree with the application and must not turn future plans into present-tense claims.

## Canonical sources

- `src/lib/faq.ts` contains visible FAQ entries, search keywords, and dated external sources.
- `src/lib/glossary.ts` contains stable glossary IDs, definitions, implementation pointers, rules, status, related terms, and public routes.
- `src/lib/product-truth.ts` contains the implementation-status matrix rendered on `/faq#trust-status`.
- `src/lib/allocation-policy.ts` remains canonical for lifecycle order, lane policy, credit constants, and approval criteria. FAQ and glossary copy should derive these values rather than duplicate them.

## External research

The strategic FAQ review performed on 2026-07-27 used first-party sources:

- [Collective Intelligence Project: Global Dialogues](https://www.cip.org/globaldialogues)
- [Metagov](https://metagov.org/)
- [Polis](https://pol.is/home)
- [Loomio](https://www.loomio.com/about/)
- [Challenge.gov platform overview](https://www.challenge.gov/assets/document-library/ChallengeGov_Platform_Overview.pdf)
- [OpenAI Researcher Access Program](https://grants.openai.com/prog/openai_researcher_access_program/)
- [Microsoft for Startups overview](https://learn.microsoft.com/en-us/startups/microsoft-for-startups/overview)

These references identify adjacent patterns and possible partner classes. They do not establish a partnership, endorsement, comprehensive competitor search, or continuing program availability.

## Update checklist

1. Keep IDs stable so existing `/faq#...` and `/glossary#...` links continue to work.
2. Update external claims only after checking a primary source, recording a new retrieval date, and removing obsolete program or model details.
3. Change product-truth status only with current code, test, deployment, and configuration evidence.
4. Preserve explicit sandbox labels for simulated money, users, run progress, provider work, and outcomes.
5. Run `npm run test`, `npm run typecheck`, `npm run lint`, and browser checks for search, reset, empty state, deep-link focus, keyboard operation, and mobile reflow.
