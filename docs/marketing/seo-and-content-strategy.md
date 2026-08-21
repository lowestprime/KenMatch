# KenMatch SEO and Content Strategy

Last reviewed: 2026-07-28

## Purpose

KenMatch should be discoverable as a public, inspectable system for proposing,
ranking, funding, and auditing sustained AI-assisted work. Search copy must
describe what the current prototype actually does. It must not imply that
simulated funding, example runs, or sandbox outcomes are live investments or
delivered production work.

This document is a maintainable strategy and implementation contract. It is not
a keyword list, link-buying plan, or automated posting brief.

## Audiences and useful entry points

| Audience | Primary question | Best entry point | Useful proof |
| --- | --- | --- | --- |
| People with difficult public-interest problems | Can I propose work that needs more than one model response? | `/submit`, `/faq#what-is-a-ken` | Bounded Ken template, sources, checkpoints, review |
| Researchers and evaluators | Is the process inspectable and reproducible? | `/verification`, `/reviews`, Ken detail | Acceptance gates, provenance, corrections, audit trail |
| AI governance and civic-participation practitioners | How can the public influence what costly AI work receives attention? | `/governance`, `/about` | Voice is separate from money, visible lifecycle, public decisions |
| Open-source builders | Is there concrete technical work to inspect or improve? | GitHub, `/kens`, `/discuss` | Source, issue history, reproducible artifacts |
| Potential sponsors and partners | What does support fund, and can it buy rank? | `/economics`, `/faq` | Restricted-fund accounting, treasury state, rank independence |
| New community members | What is a Ken and how do I participate? | `/faq`, `/glossary`, `/kens` | Concise definition, terms, participation steps |

## Search-intent evidence

The July 28, 2026 review found adjacent, real demand rather than a proven
high-volume category. No keyword-volume claims are made.

- Public participation in AI governance is active policy territory. The OECD
  examines AI-supported citizen participation, while the United Nations has
  established a Global Dialogue on AI Governance. This supports clear content
  about public participation and governance, not claims that KenMatch is a
  government process.
- Collective intelligence and AI deliberation are active research themes. The
  Collective Intelligence Project studies public input into AI, and Google
  DeepMind has published work on AI-assisted group deliberation. This supports
  explainers comparing proposals, deliberation, voting, and accountable
  decisions.
- "Long-horizon AI" results are dominated by agent and benchmark research,
  including OSWorld and MultiAgentBench. KenMatch should therefore explain its
  distinct user intent: publicly scoped, checkpointed work that can continue
  beyond one response, rather than claiming a new benchmark category.
- Exact phrasing around "transparent AI compute allocation" is sparse. It is a
  useful truthful description, but it should not be repeated unnaturally or
  treated as a validated high-volume keyword.
- Search intent around public AI governance and collective intelligence is more
  mature than intent around crowdsourced compute allocation. Educational pages
  should lead with the user problem and plain-language mechanism.

Primary references:

- [OECD, Artificial Intelligence and the Future of Citizen Participation](https://www.oecd.org/en/publications/artificial-intelligence-and-the-future-of-citizen-participation_7b5ba208-en.html)
- [United Nations, Global Dialogue on AI Governance](https://www.un.org/global-digital-compact/en/ai)
- [Collective Intelligence Project, Public AI](https://www.cip.org/research)
- [Google DeepMind, Habermas Machine](https://deepmind.google/discover/blog/ai-can-help-humans-find-common-ground-in-democratic-deliberation/)
- [OSWorld benchmark](https://os-world.github.io/)
- [ACL Anthology, MultiAgentBench](https://aclanthology.org/2025.acl-long.421/)

## Content pillars

1. **What a Ken is.** A Ken is a bounded public proposal for sustained
   AI-assisted work, with sources, checkpoints, and review.
2. **How public prioritization works.** Explain pulse, scarce voice, category
   ranking, lanes, ties, eligibility, and why money cannot buy rank.
3. **How work remains accountable.** Show deliverables, acceptance criteria,
   source requirements, checkpoints, correction history, stop reasons, and
   release decisions.
4. **How capacity and money are governed.** Explain treasury state, restricted
   support, launch capacity, and the distinction between simulated and live
   values.
5. **What the prototype proves and does not prove.** Publish implementation
   status, known limits, and reproducible technical notes.
6. **Community case studies.** Turn completed or redirected Kens into factual
   records about the question, method, evidence, outcome, and lessons. Do not
   manufacture testimonials or results.

## Route and canonical policy

Public base pages, valid public Ken/profile/discussion detail pages, and a single
valid category or lane filter may be indexed. Search, sort, stage, pagination,
combined-filter, and invalid-filter variants are useful application states but
are not separate search documents.

| Surface | Index policy | Canonical |
| --- | --- | --- |
| Public static route | index, follow | exact route |
| Public Ken/profile/discussion detail | index, follow | stable slug route |
| `/kens?category=<valid-slug>` | index, follow | exact category URL |
| `/kens?tier=<valid-lane>` | index, follow | exact lane URL |
| Search/sort/stage/page/combined variants | noindex, follow | `/kens` |
| Discussion listing query variants | noindex, follow | `/discuss` |
| Account, auth, admin, reset, verify, API | noindex/noarchive | none |
| Missing, private, suspended, or unapproved entity | noindex or 404 | none |
| Legacy `/people` and changelog routes | permanent redirect | `/profiles` or `/about#changelog` |

`robots.txt` controls crawler access, not reliable removal from search. Private
and noncanonical surfaces therefore use response metadata and headers as well
as access control. This follows [Google's robots guidance](https://developers.google.com/search/docs/crawling-indexing/robots/intro).

## Sitemap policy

`src/app/sitemap.ts` emits public static routes and public database-backed Kens,
profiles, and discussions. It excludes private intake records, suspended
profiles, admin/auth/account routes, API routes, and query variants. Dynamic
timestamps come from public activity where available; dates are not fabricated.
The sitemap supports discovery, especially for a new site, but does not promise
indexing. See [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview).

## Structured data

- Root: `WebSite` with a Ken search action and a `Project` entity.
- FAQ: `FAQPage` matching visible questions and answers.
- Public detail routes: `BreadcrumbList` and a conservative matching entity
  (`CreativeWork`, `ProfilePage`, or `DiscussionForumPosting`).
- Private or unavailable entities: no public structured data.

Structured data must describe visible content and is not a rich-result promise.
Google no longer generally shows FAQ rich results for ordinary sites. Breadcrumb
markup follows [Google's breadcrumb specification](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb);
schema types follow [Schema.org Project](https://schema.org/Project) and
[Schema.org CreativeWork](https://schema.org/CreativeWork).

## Titles, descriptions, headings, and internal links

- Every indexable route gets one route-specific title, plain-language
  description, canonical, Open Graph record, and Twitter card.
- Every page has one descriptive `h1`; section headings descend semantically.
- Navigation labels and internal links use user language: Ken, lane, category,
  checkpoint, review, and backing.
- Kens link to their category and lane filters; policies link to the FAQ,
  glossary, review outcomes, governance, and economics records.
- Copy answers a reader's question first. Exact phrases are never repeated to
  manipulate relevance.

## Social and asset contract

- `public/og-image.png`: PNG, 2400 x 1199, sRGB.
- `public/share-image.png`: PNG, 2400 x 1199, sRGB.
- SVG marks remain preferred in product UI; PNG/ICO assets remain for crawler,
  browser, and message-client compatibility.
- Route metadata declares the actual image dimensions and `image/png`.
- Protected production assets remain byte-stable unless a reproducible defect is
  demonstrated.

## Performance and rendering contract

- Next font assets are self-hosted in the build output and use `display: swap`.
- Brand and category bitmap fallbacks use `next/image` with stable dimensions.
- Generic panels avoid blur and heavyweight visual effects; charting is
  dependency-free SVG with semantic tables.
- Search and database-backed listings are bounded and paginated server-side.
- The response audit validates rendered metadata; lab browser checks report
  measured local values separately from real-user Core Web Vitals.
- No field-performance claim is allowed without production RUM or Search Console
  evidence.

## Measurement

Track quality and task completion rather than raw attention:

- non-branded impressions leading to FAQ, governance, or Ken detail;
- successful first-time movement from definition to feed or submit;
- FAQ searches that return no result;
- discussion-to-Ken and Ken-to-evidence navigation;
- repeat contributors and accepted corrections;
- external links that produce substantive proposals, reviews, or contributors;
- crawl/index coverage errors, canonical conflicts, and structured-data errors;
- real-user Core Web Vitals when privacy-safe measurement is available.

Do not optimize for follower counts, indiscriminate backlinks, comment volume,
or low-quality signups.

## Maintenance checklist

1. Run `npm run audit:seo` against the candidate production server.
2. Inspect `robots.txt` and `sitemap.xml` after route or policy changes.
3. Validate one public and one private instance of each dynamic content type.
4. Confirm social assets, dimensions, content types, and hashes.
5. Review Search Console and privacy-safe analytics for crawl or comprehension
   failures.
6. Update this document when the canonical, indexing, or schema policy changes.
