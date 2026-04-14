# Synology NAS Deployment Guide

This guide matches the current repository state on DSM 7.2+ with Container Manager.

The current KenMatch deployment model is designed for a private home network origin:

- the app container binds to `127.0.0.1:3000` only
- the app runs as a non-root user (`1001:1001`)
- the container filesystem is read-only except for the mounted data directory
- public traffic is expected to reach the NAS through a reverse proxy or, preferably, a Cloudflare Tunnel

Do not publish the container directly with raw router port forwarding to the internet unless you fully understand and accept the risk. For a public home-network deployment, the safer default is:

1. internet traffic -> Cloudflare edge
2. Cloudflare Tunnel -> your NAS
3. optional DSM reverse proxy -> KenMatch container on `127.0.0.1:3000`

## 1. Before you deploy

Complete these NAS-side checks first:

1. Update DSM, Container Manager, and all security-related packages.
2. Enable MFA on DSM administrator accounts.
3. Disable or avoid daily use of the default `admin` account.
4. Turn on Auto Block and Synology firewall rules.
5. Keep KenMatch in its own Docker project folder and back up the `data` directory.

If you skip those steps, app-level hardening alone is not enough.

## 2. Prepare the project folder

Create a project folder, for example:

```text
/volume1/docker/kenmatch
```

Copy the repository there by SSH, SMB, or File Station.

Example SSH flow:

```bash
cd /volume1/docker
git clone <your-repo-url> kenmatch
cd kenmatch
```

## 3. Prepare writable storage for the app

The container runs as user `1001:1001`, and only `/app/data` is writable.

Create the data folder and make sure it is writable by UID/GID `1001`:

```bash
mkdir -p /volume1/docker/kenmatch/data
chown -R 1001:1001 /volume1/docker/kenmatch/data
```

If you prefer to manage permissions through DSM shared-folder ACLs, ensure the mapped folder still resolves to writable storage for that UID/GID.

## 4. Create `.env`

Copy `.env.example` to `.env` and fill it out.

Minimal public-ready example:

```env
DATABASE_URL=
DATABASE_AUTH_TOKEN=
KENMATCH_DB_FILE=data/kenmatch.sqlite
KENMATCH_SESSION_COOKIE=kenmatch-session
KENMATCH_SESSION_DAYS=30
KENMATCH_ALLOW_SIGNUPS=true
KENMATCH_PUBLIC_ORIGIN=https://kenmatch.your-domain.tld
KENMATCH_ALLOWED_HOSTS=kenmatch.your-domain.tld
KENMATCH_HEALTH_TOKEN=<long-random-secret>
KENMATCH_TREASURY_TARGET_MONTHS=6
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<optional>
KENMATCH_TURNSTILE_SECRET_KEY=<optional>
STRIPE_SECRET_KEY=<optional>
STRIPE_WEBHOOK_SECRET=<optional>
DEPLOYMENT_VERSION=synology-public
```

Guidance:

- Leave `DATABASE_URL` empty if you want the NAS to use the mounted local libSQL file.
- Set `KENMATCH_PUBLIC_ORIGIN` to the final public HTTPS origin.
- Set `KENMATCH_ALLOWED_HOSTS` to the exact hostname users should reach.
- Set `KENMATCH_HEALTH_TOKEN` before public deployment, even if your container health check only uses the public-safe response.
- Add Turnstile keys for public signups and sponsor intake.
- Add Stripe keys only if you want live sponsor checkout.

## 5. Build and run the project

From the repo root on the NAS:

```bash
docker compose -f docker-compose.synology.yml up -d --build
```

Verify:

```bash
docker ps --filter name=kenmatch-demo
curl -f http://127.0.0.1:3000/api/health
```

Expected result:

- the container is running
- `/api/health` returns `ok: true`

Because the compose file binds `127.0.0.1:3000:3000`, the app is intentionally not reachable from the LAN by direct port access.

## 6. Public access: preferred topology

### Recommended: Cloudflare Tunnel

Use a Cloudflare Tunnel so your NAS origin does not require direct inbound router port exposure for KenMatch itself.

Recommended target:

- public hostname: `kenmatch.your-domain.tld`
- tunnel destination: `http://127.0.0.1:3000`

You can run the tunnel with `cloudflared` on the NAS, either as another container or as a host service.

This repo includes:

- `docker-compose.synology.tunnel.yml`
- `cloudflared/config.yml.example`

Minimal containerized flow:

1. Copy `cloudflared/config.yml.example` to `cloudflared/config.yml`.
2. Put your tunnel credentials JSON in the same `cloudflared/` folder.
3. Replace the placeholder tunnel ID and hostname.
4. Launch:

```bash
docker compose -f docker-compose.synology.tunnel.yml up -d --build
```

High-level flow:

1. Create the hostname in Cloudflare DNS.
2. Create a tunnel in Cloudflare Zero Trust.
3. Point the public hostname to `http://127.0.0.1:3000`.
4. Run the tunnel connector on the NAS.
5. Confirm the hostname loads KenMatch over HTTPS.

If you also want DSM to terminate or route multiple local services, you can instead point the tunnel at a DSM reverse proxy rule and let DSM forward to `127.0.0.1:3000`.

### Acceptable fallback: DSM reverse proxy plus router exposure

If you do not use Cloudflare Tunnel, the next-best option is:

1. DSM reverse proxy on HTTPS
2. valid TLS certificate
3. router exposure only for the reverse proxy
4. KenMatch still bound only to `127.0.0.1:3000`

Do not change the compose file back to `3000:3000` for internet exposure.

## 7. Optional public protections

### Turnstile

If you set:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
KENMATCH_TURNSTILE_SECRET_KEY=...
```

KenMatch adds Turnstile verification to:

- sign-in
- account creation
- Ken submission
- sponsor intake

### Stripe sponsorship checkout

If you set:

```env
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
KENMATCH_PUBLIC_ORIGIN=https://kenmatch.your-domain.tld
```

KenMatch can redirect sponsor intake through Stripe Checkout.

You must also configure a Stripe webhook endpoint:

```text
https://kenmatch.your-domain.tld/api/stripe/webhook
```

Listen for at least:

- `checkout.session.completed`

Without the webhook, live sponsor payments will not be promoted into committed treasury entries automatically.

## 8. Health monitoring

Public requests to `/api/health` receive a minimal response.

Detailed health output is available by sending:

```text
X-KenMatch-Health-Token: <KENMATCH_HEALTH_TOKEN>
```

Example:

```bash
curl -H "X-KenMatch-Health-Token: <token>" https://kenmatch.your-domain.tld/api/health
```

## 9. Upgrade workflow

```bash
cd /volume1/docker/kenmatch
git pull
docker compose -f docker-compose.synology.yml up -d --build
```

After each upgrade:

1. check container status
2. confirm `/api/health`
3. open the site in a browser
4. test sign-in, voting, comments, and the economics page
5. if you use the tunnel sidecar, confirm `cloudflared` is still healthy and the hostname resolves through Cloudflare

## 10. Backup and recovery

Back up at least:

- `/volume1/docker/kenmatch/data`
- `/volume1/docker/kenmatch/.env`

To fully reset a local demo database:

1. stop the container
2. remove `data/kenmatch.sqlite`
3. start the container again

The app will recreate and reseed the local database.

## 11. Troubleshooting

### The container starts but the site is unavailable publicly

Check:

- Cloudflare Tunnel or DSM reverse proxy target is `127.0.0.1:3000`
- `KENMATCH_PUBLIC_ORIGIN` matches the real public hostname exactly
- `KENMATCH_ALLOWED_HOSTS` matches the same hostname
- your TLS and DNS configuration are correct

### The app cannot write the database

Check:

- `/volume1/docker/kenmatch/data` exists
- that folder is writable by UID/GID `1001:1001`

### Signups or sponsor intake always fail

Check:

- Turnstile keys if enabled
- `KENMATCH_PUBLIC_ORIGIN`
- browser console/network errors at the public hostname

### Live sponsor checkout fails

Check:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- the public webhook endpoint
- that the public hostname is reachable from Stripe
