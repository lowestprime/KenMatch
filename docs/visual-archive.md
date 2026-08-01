# Deterministic visual archive

KenMatch keeps visual evidence in a private, repository-integrated Playwright
archive. The archive is evidence, not production telemetry: it binds every run
to an immutable commit, an explicit data provenance tier, a protected public
inventory, pinned browser tooling, and a complete capture plan.

Generated archives and all audit state are ignored by Git. Never commit
`visual-audits/`, `visual-audit/.state/`, storage state, SQLite clones, traces,
reports, PDFs, or secret files.

## Toolchain and evidence tiers

The isolated package in `visual-audit/` pins Playwright 1.61.0, Sharp 0.35.3,
and PDFKit 0.19.1. The browser version is read from the running Playwright
binary and recorded in `manifest.json`.

| Tier | Mode | Data | Intended gate |
| --- | --- | --- | --- |
| `tier-1-synthetic` | `snapshot-lab` | freshly initialized deterministic fixtures | local and CI safety/smoke |
| `tier-2-production-clone` | `snapshot-lab` | verified SQLite clone and copied illustration tree | pre-deployment parity |
| `tier-3-live-production` | `live-readonly` | current HTTPS production | post-deployment proof |

Tier 1 and 2 run only on the internal Docker network. SMTP, Stripe, Turnstile,
signup, and external providers are disabled. The app receives no published
port. Tier 2 uses SQLite `VACUUM INTO`, runs `PRAGMA quick_check`, copies files
without hardlinks, hashes the source before and after, and removes the isolated
clone after capture.

Tier 3 permits exactly one intentional sign-in request. During capture, the
browser blocks every unsafe same-origin method and every unallowlisted
cross-origin request. Safe requests include an independent audit token and the
`x-kenmatch-audit-readonly: 1` marker. The server returns HTTP 409 for an unsafe
request in that validated context and suppresses visitor telemetry.

## Protected inventory

`GET /api/visual-audit/inventory` is deliberately undiscoverable and requires:

1. an owner or administrator session; and
2. a separate 64-hex `KENMATCH_AUDIT_TOKEN`.

The response contains only public slugs, public workflow states, category/lane
names, public illustration URLs, counts, build identity, and public static-asset
digests. It never exposes email addresses, account or record IDs, contact
submissions, sponsor contacts, audit bodies, network hashes, private paths,
tokens, or configuration secrets. A missing or invalid prerequisite returns
404.

The audit reconciles source routes, protected database routes, and rendered
links. Full scope captures every canonical source/database route in Light and
OLED across these exact profiles:

- 1440x900, 1280x800, and 1024x768 desktop
- 1024x1366 at DPR 2
- 430x932, 390x844, 375x812, and 320x720 at DPR 3
- 2560x1440 at DPR 2

Canonical long pages use overlapping 12% viewport tiles, raw tile manifests,
independent scroll-container draining, stitched PNG output, and seam
correlation. The validator also checks route/status/state coverage, blank and
duplicate captures, overflow, focus and keyboard behavior, reduced motion,
forced colors, labels, heading order, assets, placeholders, console/page/network
errors, source immutability, cleanup, report/PDF presence, checksums, redaction,
and Linux permissions.

## Install and test

```sh
npm --prefix visual-audit ci
npm --prefix visual-audit test
npm --prefix visual-audit build
docker compose -f docker-compose.visual-audit-lab.yml config --quiet
docker compose -f docker-compose.visual-audit-live.yml config --quiet
```

`config --quiet` is intentional. Do not print resolved Compose configuration,
because it can contain interpolated credentials.

## Tier 1

Formal runs require a clean checkout at `TARGET_COMMIT_SHA`.

```sh
export AUDIT_EVIDENCE_TIER=tier-1-synthetic
export AUDIT_SCOPE=full
sh visual-audit/scripts/run-snapshot-lab.sh
```

For a bounded native Windows smoke:

```powershell
$runId = "<stable-run-id>"
.\visual-audit\scripts\run-windows-smoke.ps1 -Tier tier-1-synthetic -Scope smoke -RunId $runId
```

The Windows wrapper restricts the state directory to the current user. Because
Docker Desktop exposes NTFS bind mounts with synthetic Linux modes, the runner
copies the read-only mounted token into a private `0700` tmpfs and validates the
`0600` copy. Comparison, report generation, and final permission validation run
natively on Windows, where NTFS ACLs rather than Unix mode bits are authoritative.

## Tier 2

Use a fresh read-only source path from the production data tree. The script
rejects overlapping lab/source paths and does not modify the source.

```sh
export AUDIT_EVIDENCE_TIER=tier-2-production-clone
export AUDIT_SCOPE=full
export AUDIT_SOURCE_DATABASE=/absolute/read-only/export/kenmatch.sqlite
sh visual-audit/scripts/run-snapshot-lab.sh
```

On Windows, pass `-SourceDatabase C:\absolute\path\kenmatch.sqlite`.

## Manual shareable review

Capture produces the private report first and exits with status 3 when no
shareable selection has been reviewed. Open
`visual-audits/<run-id>/report/index.html`, inspect the proposed anonymous
captures, and list eligible keys:

```sh
node visual-audit/scripts/review-shareable.mjs \
  --run-root "/absolute/repo/visual-audits/<run-id>" \
  --state-file "/absolute/repo/visual-audit/.state/<run-id>/shareable-approval.json" \
  --list
```

Record only captures actually reviewed. The helper rejects authenticated or
sensitive captures.

```sh
node visual-audit/scripts/review-shareable.mjs \
  --run-root "/absolute/repo/visual-audits/<run-id>" \
  --state-file "/absolute/repo/visual-audit/.state/<run-id>/shareable-approval.json" \
  --reviewer "reviewer name" \
  --capture-key "<exact-anonymous-capture-key>" \
  --capture-key "<another-reviewed-key>"

sh visual-audit/scripts/finalize-archive.sh <run-id>
```

For a Windows snapshot run, record approval with the same helper, then rerun
`run-windows-smoke.ps1` with the identical `-RunId`. Resume identity checks
reuse completed captures, regenerate the reviewed reports, and run the native
Windows validator. Do not use the Unix finalizer for a Docker Desktop bind-mount
archive.

Finalization regenerates the private and redacted reports, then validates every
artifact and writes `checksums.json` plus `checksums.sha256`. Shareable images
receive opaque digest-derived filenames; only explicitly reviewed anonymous
captures enter the redacted HTML/PDF/manifest.

## Tier 3

Deploy the exact committed build first. Production must have the same audit
token, `KENMATCH_AUDIT_TIER=tier-3-live-production`,
`KENMATCH_AUDIT_DATA_PROVENANCE=production-live`, and
`KENMATCH_BUILD_SHA=<full deployed SHA>`.

Prepare a restricted state directory manually. `audit-token` must match the
deployed token; `admin-password` contains the owner/admin password. Do not place
either value on a command line or in shell history.

```sh
chmod 700 visual-audit/.state/<run-id>
chmod 600 visual-audit/.state/<run-id>/audit-token
chmod 600 visual-audit/.state/<run-id>/admin-password
export AUDIT_RUN_ID=<run-id>
export AUDIT_STATE_DIR=/absolute/repo/visual-audit/.state/<run-id>
export KENMATCH_ADMIN_EMAIL=<admin-email>
export AUDIT_LIVE_BASE_URL=https://kmat.ch
export AUDIT_SCOPE=full
sh visual-audit/scripts/run-live-readonly.sh
```

Review and finalize through the same two-step process. A resumed capture would
perform another sign-in, so do not rerun capture merely to add approval; use
`finalize-archive.sh`.

## Artifacts and retention

Each successful run contains:

```text
coverage-plan.json
manifest.json
asset-inventory.json
placeholder-report.json
comparison.json
validation.json
checksums.json
checksums.sha256
png/
report/index.html
report/print.html
report/selection.json
report/report-index.json
kenmatch-visual-atlas.pdf
shareable/index.html
shareable/manifest.redacted.json
shareable/kenmatch-visual-atlas-redacted.pdf
```

Archive directories are mode 700 and files mode 600 on Linux. Retention is a
dry run by default, refuses roots not named `visual-audits`, enforces at least
30 days, and preserves the newest passing run for each tier plus named approved
baselines:

```sh
sh visual-audit/scripts/prune-archives.sh
VISUAL_AUDIT_RETENTION_DAYS=90 \
VISUAL_AUDIT_PRUNE_APPLY=true \
APPROVED_BASELINE_RUN_IDS=<run-id>,<run-id> \
sh visual-audit/scripts/prune-archives.sh
```

Never use `docker compose down -v` for audit or production cleanup.

## Release sequence

The release gate is:

1. app static checks and visual-audit package checks;
2. passing full tier 1 at the candidate SHA;
3. passing full tier 2 against a fresh production clone;
4. deploy that exact SHA;
5. live health and route smoke;
6. passing tier 3 smoke, then full tier 3;
7. final archive/checksum review and completion-ledger regeneration.

If NAS credentials, a production clone, or the deployed audit token are not
available, record that exact external dependency. Synthetic evidence is not a
substitute for tier 2 or tier 3.
