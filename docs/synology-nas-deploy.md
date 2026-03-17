# Synology NAS self-host deployment guide (KenMatch demo)

This guide is optimized for your **Synology DS923+** (AMD Ryzen R1600, 64 GB RAM, DSM 7.2) to run KenMatch as a stable, self-hosted demo.

## 1) Prerequisites on DSM

1. Install **Container Manager** from Package Center.
2. Enable SSH in DSM (`Control Panel -> Terminal & SNMP -> Enable SSH`).
3. Create a shared folder for the app, for example: `/volume1/docker/kenmatch`.
4. Ensure your NAS user has read/write access to that folder.

## 2) Copy project to NAS

Use Git from SSH, or upload files via SMB/File Station.

```bash
cd /volume1/docker
git clone <your-kenmatch-repo-url> kenmatch
cd kenmatch
```

## 3) Configure environment

For fully local self-hosting (recommended first run), keep libSQL file-backed DB:

- `DATABASE_URL` empty
- `DATABASE_AUTH_TOKEN` empty
- `KENMATCH_DB_FILE=/app/data/kenmatch.sqlite`

The included `docker-compose.synology.yml` already sets these defaults.

## 4) Build and run on Synology

From SSH on the NAS:

```bash
cd /volume1/docker/kenmatch
docker compose -f docker-compose.synology.yml up -d --build
```

Then verify:

```bash
docker ps | grep kenmatch-demo
curl -f http://127.0.0.1:3000/api/health
```

Open in browser:

- `http://<NAS_LAN_IP>:3000`

## 5) Data persistence and backups

- Persistent DB is stored at `./data/kenmatch.sqlite` on the NAS share.
- Add `/volume1/docker/kenmatch/data` to your normal Hyper Backup task.
- To reset demo data, stop container and remove `data/kenmatch.sqlite`.

## 6) Reverse proxy + HTTPS (recommended)

In DSM: `Control Panel -> Login Portal -> Advanced -> Reverse Proxy`:

- Source: `https://kenmatch.your-domain.tld`
- Destination: `http://127.0.0.1:3000`

Then attach a Let’s Encrypt certificate in `Control Panel -> Security -> Certificate`.

## 7) Optional remote libSQL production mode

If you later move DB off the NAS:

- Set `DATABASE_URL` to your managed libSQL endpoint
- Set `DATABASE_AUTH_TOKEN`
- Optionally remove local `./data:/app/data` mount

## 8) DS923+ optimization notes

- With 64 GB RAM, this demo can comfortably run with default settings.
- Keep Container Manager resource limits unset initially; only cap if you colocate many services.
- Prefer SSD-backed shared folder (your NVMe pool) for lower SQLite latency.
- Keep one app replica (single container) because this demo is stateful via local file DB unless using remote libSQL.

## 9) Upgrade workflow

```bash
cd /volume1/docker/kenmatch
git pull
docker compose -f docker-compose.synology.yml up -d --build
```

## 10) Troubleshooting

- Check logs:
  ```bash
  docker logs --tail=200 kenmatch-demo
  ```
- If port 3000 is occupied, change `"3000:3000"` in compose to `"3010:3000"`.
- If health fails, inspect `DATABASE_URL` / `DATABASE_AUTH_TOKEN` and container logs.
