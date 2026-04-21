# Public Security Hardening

KenMatch now includes meaningful app-layer hardening, but a public home-network deployment still depends on edge and NAS operations. This checklist is the intended production baseline.

## App-layer controls in this repo

- strict response headers in `middleware.ts`
- host filtering and cross-site request blocking in `middleware.ts`
- secure cookie-backed sessions in `src/lib/session.ts`
- email verification and forgot-password token expiry in `src/lib/db.ts` and `src/app/actions.ts`
- SMTP-backed owner/admin notification dispatch in `src/lib/mail.ts`
- detailed-vs-public health response split in `src/app/api/health/route.ts`
- structured request rate limiting in `request_rate_limits`
- security event logging in `security_events`
- optional Cloudflare Turnstile verification on high-risk public forms
- optional Stripe Checkout plus webhook verification for live sponsorships

## Non-negotiable public-hosting rules

1. Do not expose the app container directly on a public NAS port.
2. Keep the KenMatch container bound to loopback only.
3. Put Cloudflare Tunnel or an equivalent reverse proxy in front of it.
4. Use HTTPS only for the public origin.
5. Set `KENMATCH_PUBLIC_ORIGIN` and `KENMATCH_ALLOWED_HOSTS` exactly.
6. Set `KENMATCH_HEALTH_TOKEN`.
7. Set `KENMATCH_VISITOR_HASH_SALT` and SMTP secrets before accepting public signups.
8. Run the container as non-root.
9. Back up the local database and `.env`.

## DDoS and abuse posture

KenMatch cannot provide meaningful DDoS protection by itself when hosted from a home network origin. The intended split is:

- edge provider handles volumetric DDoS filtering, WAF, bot management, and origin shielding
- KenMatch handles session hardening, request validation, rate limits, origin checks, and form abuse controls

That is why the recommended deployment path is Cloudflare Tunnel plus Turnstile, not direct router exposure.

## Recommended edge configuration

### Cloudflare

- Tunnel enabled for the KenMatch hostname
- orange-cloud DNS / proxied hostname
- WAF managed rules enabled
- rate limiting on `/auth`, `/submit`, and `/api/stripe/webhook` if exposed publicly
- Turnstile enabled on sign-in, signup, submit, and sponsor flows

### Synology

- DSM MFA enabled
- Auto Block enabled
- firewall enabled with explicit allow rules
- SSH limited to trusted admin sources where possible
- unused packages and public services disabled

## Payment safety notes

If Stripe is enabled:

- only use Checkout
- never accept raw card data in KenMatch
- keep webhook signature verification enabled
- point the webhook only at the public HTTPS hostname

## Operational checks after deployment

1. `GET /api/health` returns `ok: true`
2. sign-in works
3. signup works
4. a public vote works
5. a comment posts successfully
6. sponsor pledge flow works
7. if enabled, live sponsor checkout completes and the webhook updates the economics page
8. `/icon.svg`, `/icon-dark.svg`, `/apple-touch-icon.svg`, and `/manifest.webmanifest` return 200
9. if using Cloudflare Tunnel, the tunnel connector is healthy and the NAS app remains loopback-only

## Honest boundary

No repository can make a home-network-hosted service “fully secure” on its own. The strongest outcome comes from combining:

- hardened app defaults
- private origin exposure
- edge filtering
- disciplined NAS administration
- backups
- software updates
