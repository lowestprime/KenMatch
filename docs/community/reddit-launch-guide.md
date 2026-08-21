# r/kenmatch Community Launch Guide

Last verified: 2026-07-28

## Verified public state

`https://www.reddit.com/r/kenmatch/` is reachable as a public community and uses
KenMatch branding and a description that links to `kmat.ch`. Reddit's public
metadata reported one subscriber, a July 17, 2026 creation date, and two visible
rules at verification time.

Logged-out public data does not prove that the KenMatch operator controls the
moderator account. Until control is verified in an authenticated moderator
session, the website and documentation must call it the **r/kenmatch community**,
not the official subreddit or a KenMatch-managed forum. Do not change subreddit
configuration from repository automation.

## Control verification before configuration

The operator should confirm all of the following while authenticated:

- the intended owner account appears in the moderator list;
- the account can edit community settings, rules, appearance, post flair, user
  flair, removal reasons, and automoderator;
- recovery email and multifactor authentication are current;
- at least one second trusted moderator has an explicit, limited role;
- no unknown moderator, installed app, or bot has elevated permission.

Record only the verification date and responsible role in private operations
notes. Do not commit Reddit credentials, recovery data, moderator identities, or
session evidence.

## Branding

- Use the checked-in production KenMatch icon and banner assets without
  approximating or regenerating them.
- Keep the description concise: explain Kens, link `https://kmat.ch/faq`, and
  disclose that the site is a public sandbox prototype.
- Use OLED black with blue, gold, red, and purple accents; preserve readable
  contrast and circular icon cropping.
- Link the website, FAQ, governance policy, GitHub repository, and contact route.
- Do not use "official" until moderator control has been verified and the owner
  deliberately adopts that language.

## Recommended rules

1. **Stay relevant.** Posts must concern KenMatch, a specific Ken, the ranking or
   governance mechanism, sustained AI work, or a directly related public need.
2. **Be specific and evidence-aware.** Distinguish fact, source, inference,
   proposal, and opinion. Link primary sources when making material claims.
3. **No harassment or identity attacks.** Critique ideas, decisions, code, and
   evidence without targeting private individuals.
4. **No spam, solicitation, or vote manipulation.** No referral spam,
   coordinated votes, astroturfing, undisclosed automation, or repeated
   cross-posting.
5. **Disclose interests.** Sponsors, vendors, project owners, and paid
   participants must disclose relevant relationships.
6. **Protect privacy and security.** Do not post credentials, private
   correspondence, personal data, exploit details before coordinated repair, or
   requests for deanonymization.
7. **Do not misrepresent sandbox data.** Demo money, runs, users, and outcomes
   must not be described as live commitments or delivered work.
8. **Keep authoritative records on KenMatch.** Link material review,
   checkpoint, correction, and governance decisions to the matching on-site
   record.

## Post flair

- `Ken proposal`
- `Scope review`
- `Evidence and sources`
- `Checkpoint review`
- `Governance`
- `Technical / GitHub`
- `Question`
- `Feedback`
- `Correction`
- `Announcement`
- `Sandbox demo`

Reserve `Announcement` for verified moderators. Require `Sandbox demo` whenever
the post could otherwise imply live financial or execution data.

## User flair

Use voluntary, non-authoritative labels only:

- `Contributor`
- `Reviewer`
- `Domain specialist`
- `Open-source maintainer`
- `Community moderator`

Do not use flair as identity verification, voting weight, expert certification,
or proof of a KenMatch account role.

## Moderation boundaries

Moderators may enforce relevance, conduct, privacy, security, spam, and disclosure
rules. They must not:

- change Ken rank or allocation state through Reddit activity;
- treat Reddit scores as KenMatch pulse or voice;
- promise funding, compute, acceptance, or release;
- publish private intake or review information;
- delete good-faith criticism because it is inconvenient;
- accept sponsor direction over moderation or rank.

When a Reddit thread identifies a material issue, create or link the appropriate
KenMatch discussion, review record, contact submission, or GitHub issue. The
on-site record should preserve the disposition.

## Launch posts

Publish manually after the production and archive acceptance gates pass:

1. **Welcome and scope.** What a Ken is, what the community is for, rules, and
   where authoritative records live.
2. **Prototype tour.** Feed, categories, lanes, lifecycle, review outcomes,
   economics, FAQ, and sandbox disclosure.
3. **Mechanism critique.** Invite specific criticism of pulse, scarce voice,
   lane assignment, sponsor separation, and stopping conditions.
4. **First Ken review.** Link one bounded example and ask for source, acceptance,
   or scope corrections.
5. **Open-source review.** Link the repository, architecture, threat model,
   deterministic tests, and visual archive.

Do not submit duplicate launch posts across unrelated subreddits. Cross-post only
when the destination rules and audience make the exact content useful.

## Cross-linking policy

- Website footer and About page may link to r/kenmatch as an external community.
- The subreddit sidebar should link the live site, FAQ, governance, review
  outcomes, contact form, and GitHub repository after control verification.
- Each substantive Reddit thread should link the most specific KenMatch page,
  not only the home page.
- KenMatch pages should not embed Reddit scores or imply Reddit engagement
  affects rank.
- Add `utm_source=reddit` only if analytics documentation covers the parameter
  and it does not create indexable duplicate URLs.

## Anti-spam and automation

- Enable Reddit's native crowd control and reputation filters conservatively.
- Begin with manual moderation and documented removal reasons.
- Any later automoderator rule must be versioned in a private operational record,
  tested against false positives, and reviewed by a human.
- Never automate posting, replies, votes, direct messages, or account creation.
- Never buy engagement or coordinate votes.
- Rate-limit repeated links and require disclosure for fundraising, vendors, and
  surveys.

## Escalation

| Issue | Immediate action | Durable record |
| --- | --- | --- |
| Ordinary rule violation | Remove or warn with reason | Moderator log |
| Repeated spam or evasion | Temporary then permanent ban | Moderator log and pattern note |
| Credible safety threat | Restrict visibility, preserve evidence, notify Reddit | Private incident record |
| Personal data or doxxing | Remove immediately and notify affected operator | Privacy incident record |
| Security vulnerability | Remove exploit detail if necessary, route to contact form | GitHub/private security record after repair |
| Impersonation or financial fraud | Pin correction, report account, notify operator | Public correction and incident record |
| Moderator conflict | Recuse and assign another moderator | Conflict note |
| Disputed KenMatch decision | Keep discussion visible and link the on-site appeal | KenMatch review/audit record |

## Archive and retention

- Preserve public launch posts, rule changes, major corrections, and moderator
  announcements using Reddit permalinks and repository-tracked text summaries.
- Do not scrape or republish user profiles, deleted content, private messages,
  moderator mail, or personal data.
- Monthly, record only material community decisions and broken links in the
  KenMatch changelog or governance record.
- If the subreddit is abandoned or control is lost, remove the on-site link,
  publish a clear notice, and retain `/discuss` as the canonical community
  surface.

## Prelaunch checklist

- [ ] Authenticated moderator control verified.
- [ ] Moderator roles and recovery controls reviewed.
- [ ] Branding matches protected production assets.
- [ ] Description and sidebar disclose prototype/sandbox status.
- [ ] Rules, flairs, removal reasons, and escalation path configured.
- [ ] Welcome, prototype, mechanism-critique, and source-review posts prepared.
- [ ] No automated posting or vote behavior enabled.
- [ ] `/discuss`, FAQ, governance, GitHub, and contact links tested.
- [ ] Live site, health endpoint, SEO audit, and visual archive pass.
