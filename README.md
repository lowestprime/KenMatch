# KenMatch

KenMatch is a full-stack platform prototype for democratizing access to sustained frontier AI work. It turns the conception document into a deployable product surface with attributable accounts, earned quadratic voice, Reddit-style public curation, checkpoint-gated execution, visible safety boundaries, and a treasury/revenue engine that is explicitly separate from governance.

## What this build now implements

- Public proposal marketplace with search, categories, stage/tier filters, and realistic long-horizon AI/public-interest examples.
- Real contributor accounts and server-side sessions instead of a demo profile switcher.
- Earned quadratic voice for scarce allocation, plus separate up/down pulse voting for broad public curation.
- Threaded comments with replies, voting, and small stakes for discussion quality.
- Proposal quality bonds, checkpoint approval gates, run metadata, rollback plans, and visible blocked work.
- Economics surface for enterprise packaging, data licensing, compute arbitrage, sponsorship routing, treasury entries, and the 80/20 public reporting split.
- Light/dark mode, richer motion, stronger visual hierarchy, security headers, and a health endpoint.

## Stack

- [Next.js 16](https://nextjs.org/blog/next-16)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [libSQL TypeScript client](https://docs.turso.tech/sdk/ts/quickstart) for local-file or remote libSQL persistence
- `zod` for form and environment validation

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Environment

Copy [.env.example](/C:/Users/Cooper/Desktop/kenmatch/.env.example) and set values as needed.

- `DATABASE_URL`: leave empty for the local file database, or point it at a remote libSQL database for deployment.
- `DATABASE_AUTH_TOKEN`: auth token for remote libSQL deployments.
- `KENMATCH_DB_FILE`: local fallback database path.
- `KENMATCH_SESSION_COOKIE`: session cookie name.
- `KENMATCH_SESSION_DAYS`: session lifetime.
- `KENMATCH_ALLOW_SIGNUPS`: set to `false` if accounts should be provisioned externally.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deployment notes

- The app now uses the stable libSQL client instead of Node's experimental `node:sqlite` API.
- For local development, KenMatch uses a file-backed SQLite-compatible database via libSQL.
- For public deployment, set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` to a managed remote libSQL database.
- A simple health endpoint is available at `/api/health`.
- Security headers are configured in [next.config.ts](/C:/Users/Cooper/Desktop/kenmatch/next.config.ts).

## Project map

- [src/app](/C:/Users/Cooper/Desktop/kenmatch/src/app) contains routes, server actions, and the health endpoint.
- [src/components](/C:/Users/Cooper/Desktop/kenmatch/src/components) contains the shell, auth, curation, discussion, and proposal UI.
- [src/lib/db.ts](/C:/Users/Cooper/Desktop/kenmatch/src/lib/db.ts) contains schema initialization, seeding, hydration, auth persistence, and write flows.
- [docs/requirements-traceability.md](/C:/Users/Cooper/Desktop/kenmatch/docs/requirements-traceability.md) maps conception requirements to implementation.
- [docs/architecture.md](/C:/Users/Cooper/Desktop/kenmatch/docs/architecture.md) explains the current stack and deploy model.

## Source material

- [KenMatch_Conception.md](/C:/Users/Cooper/Desktop/kenmatch/KenMatch_Conception.md)
