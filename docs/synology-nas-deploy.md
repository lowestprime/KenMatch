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
KENMATCH_PUBLIC_ORIGIN=https://kmat.ch
KENMATCH_CANONICAL_ORIGIN=https://kmat.ch
KENMATCH_ALLOWED_HOSTS=kmat.ch,www.kmat.ch
KENMATCH_HEALTH_TOKEN=<long-random-secret>
KENMATCH_TREASURY_TARGET_MONTHS=6
KENMATCH_REQUIRE_EMAIL_VERIFICATION=true
KENMATCH_OWNER_EMAIL=cooperbeaman@gmail.com
KENMATCH_NOTIFICATION_EMAILS=cooperbeaman@proton.me
KENMATCH_SMTP_HOST=<smtp-host>
KENMATCH_SMTP_PORT=587
KENMATCH_SMTP_USER=<smtp-user>
KENMATCH_SMTP_PASS=<smtp-password-or-app-token>
KENMATCH_SMTP_SECURE=false
KENMATCH_SMTP_FROM=KenMatch <no-reply@kmat.ch>
KENMATCH_VISITOR_HASH_SALT=<long-random-secret>
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
- Set SMTP variables before enabling required email verification or forgot-password flows in production.
- Set `KENMATCH_VISITOR_HASH_SALT` to a long random value before first public launch; rotating it later resets unique-visitor deduplication.
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

- public hostname: `kmat.ch`
- tunnel destination: `http://127.0.0.1:3000`

You can run the tunnel with `cloudflared` on the NAS, either as another container or as a host service.

This repo includes:

- `docker-compose.synology.tunnel.yml`
- `cloudflared/config.yml.example`

Minimal containerized flow:

1. Copy `cloudflared/config.yml.example` to `cloudflared/config.yml`.
2. Put your tunnel credentials JSON in the same `cloudflared/` folder.
3. Replace the placeholder tunnel ID and hostname with the Cloudflare Tunnel and `kmat.ch` hostname for the production deployment.
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
KENMATCH_PUBLIC_ORIGIN=https://kmat.ch
```

KenMatch can redirect sponsor intake through Stripe Checkout.

You must also configure a Stripe webhook endpoint:

```text
https://kmat.ch/api/stripe/webhook
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
curl -H "X-KenMatch-Health-Token: <token>" https://kmat.ch/api/health
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

## 10. Persistence, backup, and recovery

### 10.1 What persists across container rebuilds

Everything that gets written by users from the live site (new accounts, Kens, votes, pulse reactions, comments, sponsorship commitments, audit log entries, notifications settings, verification requests, visitor aggregates, profile pictures, About-page edits) lives in a single SQLite database file:

- `/volume1/docker/kenmatch/data/kenmatch.sqlite`

That path is bind-mounted into the container as `/app/data/kenmatch.sqlite` via the `volumes:` section of both `docker-compose.synology.yml` and `docker-compose.synology.tunnel.yml`. Rebuilding or recreating the container does **not** touch the file, because the container only contains the application runtime; persistent state is stored exclusively under `data/` on the Synology host.

### 10.2 Required hot backups

Back up the following from the Synology host. Treat everything in `data/` as hot state that must be snapshotted regularly.

- `/volume1/docker/kenmatch/data/kenmatch.sqlite` — primary database (required)
- `/volume1/docker/kenmatch/data/kenmatch.sqlite-wal` and `-shm` — write-ahead log, if present (optional but recommended during live operation)
- `/volume1/docker/kenmatch/.env` — credentials, Stripe keys, SMTP keys, tunnel config (required)
- `/volume1/docker/kenmatch/cloudflared/` — tunnel credentials file(s) (required if you use the tunnel sidecar)

### 10.3 Recommended redundancy

For a public deployment you want at least two disjoint backup destinations:

1. **Synology Hyper Backup** → encrypted off-box destination (Synology C2, S3, or a second NAS). Schedule a daily job that includes `/volume1/docker/kenmatch/data` and `/volume1/docker/kenmatch/.env`.
2. **Git-tracked configuration** → keep only the non-secret config (docker-compose files, nginx/cloudflared examples, scripts) in the GitHub repository. Do **not** commit `.env` or the database.

Optional third layer: for zero-downtime rebuilds, configure `DATABASE_URL` to point at a managed libSQL/Turso instance and set `KENMATCH_DB_FILE` to a stub path. The app picks up the remote database automatically and local disk becomes a cache only. Daily snapshots are still recommended on the managed service.

### 10.4 Consistent snapshot command

Taking a copy of a live SQLite file requires using the database's own snapshot command rather than `cp`, because the WAL file may contain in-flight transactions.

```bash
docker exec kenmatch-demo sh -c \
  'sqlite3 /app/data/kenmatch.sqlite ".backup /app/data/backups/kenmatch-$(date -Iseconds).sqlite"'
```

Rotate the files in `data/backups/` with a Hyper Backup or cron job.

### 10.5 Recovery drill

To verify your backups actually restore:

1. stop the container: `docker compose -f docker-compose.synology.yml down`
2. move the live DB aside: `mv data/kenmatch.sqlite data/kenmatch.sqlite.live`
3. copy the backup you want to verify into place: `cp data/backups/kenmatch-<timestamp>.sqlite data/kenmatch.sqlite`
4. `chown 1001:1001 data/kenmatch.sqlite`
5. bring the container back up and confirm accounts, Kens, votes, and comments match the backed-up state
6. when satisfied, restore the live DB with `mv data/kenmatch.sqlite.live data/kenmatch.sqlite`

### 10.6 Fully resetting local demo data

To blank the local database without losing the container image:

1. stop the container
2. remove `data/kenmatch.sqlite` (and the `-wal` / `-shm` siblings if present)
3. start the container again

The app recreates the schema and reseeds demo data on first boot. Accounts created from the live site are **not** recoverable after this reset; run the recovery drill in 10.5 from a backup instead.

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
