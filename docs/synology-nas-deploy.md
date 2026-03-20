# Synology NAS deployment guide for KenMatch

This guide is written for a Synology NAS running DSM 7.2.x with Container Manager. It matches the current repository state:

- standalone Next.js build
- Docker image driven by `server.js`
- compose file at `docker-compose.synology.yml`
- persistent local libSQL file database mounted at `./data`
- health endpoint at `/api/health`

## What this guide assumes

- Your NAS already has outbound internet access for image builds.
- Container Manager is installed.
- You have a shared folder for Docker projects, for example `/volume1/docker/kenmatch`.
- You can either use SSH or the DSM web UI.

## Files used from this repo

- `Dockerfile`
- `docker-compose.synology.yml`
- `.env.example`

## 1. Prepare the project folder on the NAS

Create a folder such as:

```bash
/volume1/docker/kenmatch
```

Copy the repository into that folder either by:

- `git clone` over SSH
- SMB / Finder / Explorer copy
- File Station upload

If you use SSH:

```bash
cd /volume1/docker
git clone <your-repo-url> kenmatch
cd kenmatch
```

## 2. Create the environment file

In the project root, create `.env`.

Recommended first-run settings for a self-contained NAS demo:

```env
DATABASE_URL=
DATABASE_AUTH_TOKEN=
KENMATCH_DB_FILE=/app/data/kenmatch.sqlite
KENMATCH_SESSION_COOKIE=kenmatch-session
KENMATCH_SESSION_DAYS=30
KENMATCH_ALLOW_SIGNUPS=true
DEPLOYMENT_VERSION=nas-demo
```

Why this setup is the safest first deployment:

- the app keeps its database inside the mounted NAS folder
- no external database dependency is required
- the health check can verify the entire stack locally

## 3. Deploy from SSH with Docker Compose

From the repository root on the NAS:

```bash
docker compose -f docker-compose.synology.yml up -d --build
```

Then verify:

```bash
docker ps --filter name=kenmatch-demo
curl -f http://127.0.0.1:3000/api/health
```

Expected result:

- the container is running
- `/api/health` returns JSON with `ok: true`

Open the app on your LAN:

```text
http://<NAS-LAN-IP>:3000
```

## 4. Deploy from DSM Container Manager without SSH

Synology’s official Container Manager feature page says the **Project** dashboard can create and manage multi-container Docker projects using Compose files. That lines up directly with this repository’s `docker-compose.synology.yml` file.

### DSM web UI path

1. Open `Container Manager`.
2. Open `Project`.
3. Choose `Create`.
4. Choose the option to create a project from a compose file or from a folder that contains one.
5. Point it at your copied KenMatch folder.
6. Select `docker-compose.synology.yml`.
7. Make sure the `.env` file exists in the same folder.
8. Create the project and wait for the image build and container start.

After the project shows as running, test the health endpoint in a browser:

```text
http://<NAS-LAN-IP>:3000/api/health
```

## 5. Persistent data and backups

The compose file mounts:

```text
./data:/app/data
```

That means the live database file will end up under your NAS project folder, typically:

```text
/volume1/docker/kenmatch/data/kenmatch.sqlite
```

Recommended backup target:

- include `/volume1/docker/kenmatch/data` in Hyper Backup
- keep the repository folder itself under your normal NAS backup policy

To reset the demo database completely:

1. stop the project
2. delete `data/kenmatch.sqlite`
3. start the project again

The app will recreate and reseed the local database.

## 6. Optional remote libSQL mode

If you want the NAS to run the app while the database lives elsewhere, set:

```env
DATABASE_URL=<your-libsql-url>
DATABASE_AUTH_TOKEN=<your-libsql-token>
```

In that mode the `./data` mount can stay in place, but it will no longer be the active database if `DATABASE_URL` is set.

## 7. Reverse proxy and HTTPS on Synology

Next.js’ official self-hosting guide recommends putting a reverse proxy in front of the Next.js server instead of exposing the app container directly to the internet.

### DSM reverse proxy flow

Use DSM’s reverse proxy UI and point a public hostname to the local KenMatch container.

Typical target mapping:

- source host: `kenmatch.your-domain.tld`
- source protocol: `HTTPS`
- destination host: `127.0.0.1`
- destination port: `3000`

DSM UI names can vary slightly by version, but the official Synology Knowledge Center pages for **Application Portal** / **Login Portal** are the right references for this part of DSM.

### Certificate flow

Use DSM certificate management to issue or attach a certificate for the KenMatch hostname.

A practical flow is:

1. create the DNS record for `kenmatch.your-domain.tld`
2. request or attach a certificate in DSM
3. bind that certificate to the reverse proxy host
4. test `https://kenmatch.your-domain.tld`

The relevant Synology Knowledge Center reference title is **How do I obtain a certificate from Let's Encrypt on my Synology NAS?**

## 8. Resource notes for a DS923+

A DS923+ is a good fit for this demo profile.

Practical recommendations:

- start with one replica only
- do not cap memory immediately unless the NAS is crowded
- keep the database on SSD-backed storage if possible
- monitor the health endpoint after large upgrades

## 9. Upgrade workflow

### SSH path

```bash
cd /volume1/docker/kenmatch
git pull
docker compose -f docker-compose.synology.yml up -d --build
```

### DSM Container Manager path

- update the repository files in the project folder
- reopen the project in Container Manager
- trigger rebuild / recreate from the updated compose project
- wait for the health check to turn healthy

## 10. Troubleshooting

### Container will not start

Check:

```bash
docker logs --tail=200 kenmatch-demo
```

### Health check fails

Check:

- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`
- that `/app/data` is writable through the mounted folder
- that port `3000` is not already occupied on the NAS

### You changed the public port

If `3000:3000` conflicts with another service, change it in `docker-compose.synology.yml`, for example:

```yaml
ports:
  - "3010:3000"
```

Then browse to:

```text
http://<NAS-LAN-IP>:3010
```

### The site works on LAN but not through the public hostname

Check:

- DNS resolves to your NAS or reverse proxy endpoint
- the reverse proxy rule points to `127.0.0.1:3000`
- the certificate is attached to the same hostname
- your router forwards ports 80 and 443 correctly if you are exposing the service publicly

## Source notes

The steps above are grounded in:

- the current repository’s Docker, compose, health, and standalone Next.js configuration
- Synology’s official Container Manager feature page, which states that the Project dashboard manages multi-container Docker projects using Compose files
- Next.js official documentation for `output: "standalone"` and self-hosting behind a reverse proxy

One honest limitation from this session: several Synology Knowledge Center pages were retrievable only by title, not with full body text, through the available browser tooling. The DSM UI paths and recommendations in this guide are therefore based on the verified page titles plus the repository’s actual deployment files, not on unretrieved body text.
