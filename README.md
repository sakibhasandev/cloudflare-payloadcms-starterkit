# Cloudflare × Payload CMS Starter Kit

An edge-native starter kit that pairs [Payload CMS](https://payloadcms.com) with [Next.js 16](https://nextjs.org) and runs entirely on the Cloudflare Developer Platform — [Workers](https://developers.cloudflare.com/workers/), [D1](https://developers.cloudflare.com/d1/), [R2](https://developers.cloudflare.com/r2/), [Queues](https://developers.cloudflare.com/queues/), and [Email](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/). Fully typed end-to-end, with a preinstalled [shadcn/ui](https://ui.shadcn.com) component library, background jobs, transactional email, and a working admin panel out of the box.

## Features

- **Payload CMS 3** — headless CMS with a Lexical rich-text editor, REST + GraphQL APIs, and auto-generated TypeScript types.
- **Next.js 16 App Router** — React Server Components, deployed to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare).
- **Cloudflare D1** — serverless SQLite at the edge, wired up through Payload's D1 adapter and Drizzle ORM with file-based migrations.
- **Cloudflare R2** — media uploads stored on object storage with zero egress fees.
- **Cloudflare Images** — built-in image optimization through the Workers `IMAGES` binding.
- **Cloudflare Queues** — Payload's [jobs queue](https://payloadcms.com/docs/jobs-queue/overview) wired to a Cloudflare Queue, so background tasks run durably with delays, retries, and scheduling.
- **Cron Triggers** — Payload task/workflow `schedule` configs are driven by a [Cloudflare Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/), so recurring jobs queue automatically on the edge.
- **Transactional email** — send React-rendered emails through the Workers `EMAIL` binding via [`payload-email-cloudflare`](https://www.npmjs.com/package/payload-email-cloudflare) and [React Email](https://react.email).
- **shadcn/ui + Tailwind CSS v4** — a full, themed component library ready to compose.
- **Type-safe** — types flow from your Payload collections straight into the UI; Cloudflare bindings are typed via `wrangler types`.

## Tech stack

| Layer            | Technology                                                                   |
| ---------------- | ---------------------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, RSC)                                                 |
| CMS              | Payload CMS 3.85                                                             |
| Runtime / Deploy | Cloudflare Workers via `@opennextjs/cloudflare`                              |
| Database         | Cloudflare D1 (SQLite) + `@payloadcms/db-d1-sqlite` + Drizzle ORM            |
| File storage     | Cloudflare R2 via `@payloadcms/storage-r2`                                   |
| Background jobs  | Cloudflare Queues + Payload jobs queue                                       |
| Email            | Cloudflare Email (`send_email`) via `payload-email-cloudflare` + React Email |
| Editor           | Lexical (`@payloadcms/richtext-lexical`)                                     |
| UI               | shadcn/ui, Base UI, Radix, Tailwind CSS v4                                   |
| Language / Tools | TypeScript, ESLint, pnpm                                                     |

## Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) (this repo ships with a `pnpm-lock.yaml`)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) for deployment

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
# Used to sign/secure Payload — generate a long random string
PAYLOAD_SECRET=your-long-random-secret

# Required only for remote D1 migrations via Drizzle Kit (drizzle-kit migrate)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_DATABASE_ID=your-d1-database-id
CLOUDFLARE_D1_TOKEN=your-d1-api-token
```

`.dev.vars` is used to pass variables into `wrangler dev`. The default sets `NEXTJS_ENV` so that `.env.development*` files are loaded in preview.

> **Note:** All `.env*` and `.dev.vars*` files are gitignored by default. Commit `.env.example` / `.dev.vars.example` files instead if you want to share defaults.

### 3. Provision Cloudflare resources

Create a D1 database, an R2 bucket, and a Queue, then update [`wrangler.jsonc`](wrangler.jsonc) with the real names/IDs (the repo ships with `db-name`, `db-id`, and `bucket-name` placeholders):

```bash
# Create a D1 database
npx wrangler d1 create my-database

# Create an R2 bucket
npx wrangler r2 bucket create my-bucket

# Create the jobs queue (the name must match wrangler.jsonc)
npx wrangler queues create payload-jobs-queue
```

Then edit [`wrangler.jsonc`](wrangler.jsonc):

```jsonc
"d1_databases": [
    { "binding": "D1", "database_name": "my-database", "database_id": "<id-from-create>" }
],
"r2_buckets": [
    { "binding": "R2", "bucket_name": "my-bucket" }
]
```

The Queue (`QUEUE` producer + `payload-jobs-queue` consumer) and the `EMAIL` `send_email` binding are preconfigured in [`wrangler.jsonc`](wrangler.jsonc) — see [Background jobs](#background-jobs) and [Email](#email) below.

If you rename the database, also update the `db-name` references in the `migrate:local` / `migrate:deploy` scripts in [`package.json`](package.json).

### 4. Run database migrations

```bash
# Apply migrations to your local D1 instance
pnpm migrate:local
```

### 5. Start the dev server

```bash
pnpm dev
```

- Frontend → http://localhost:3000
- Payload admin → http://localhost:3000/admin

The first time you open the admin panel, you'll be prompted to create your first user.

## Bindings

The Worker is configured with the following Cloudflare bindings (see [`wrangler.jsonc`](wrangler.jsonc)):

| Binding                 | Type          | Purpose                                                      |
| ----------------------- | ------------- | ------------------------------------------------------------ |
| `D1`                    | D1 Database   | Payload's primary datastore                                  |
| `R2`                    | R2 Bucket     | Media / file uploads                                         |
| `QUEUE`                 | Queue         | Dispatches Payload background jobs                           |
| `EMAIL`                 | Send Email    | Outbound transactional email                                 |
| `ASSETS`                | Static Assets | Serves the built Next.js static output                       |
| `IMAGES`                | Images        | On-the-fly image optimization                                |
| `WORKER_SELF_REFERENCE` | Service       | Self-reference used by OpenNext for ISR/caching and job runs |

## Database & migrations

Payload owns the schema. The workflow is:

1. Edit your collections in [`src/collections/`](src/collections/).
2. Generate a Drizzle schema snapshot from Payload, then create a migration:

    ```bash
    pnpm generate:schema   # payload -> src/db/schema.ts
    pnpm migrate:create    # drizzle-kit generate -> migrations/
    ```

3. Apply migrations locally or remotely:

    ```bash
    pnpm migrate:local     # wrangler d1 migrations apply <db> --local
    pnpm migrate:deploy    # wrangler d1 migrations apply <db> --remote
    ```

## Type generation

```bash
pnpm typegen      # Payload collection types + admin import map
pnpm cf-typegen   # Cloudflare binding types -> cloudflare-env.d.ts
```

Run these after changing collections or `wrangler.jsonc` bindings to keep types in sync.

## Background jobs

Payload's [jobs queue](https://payloadcms.com/docs/jobs-queue/overview) is wired to a Cloudflare Queue so tasks run durably, off the request path. The flow:

1. Define tasks in [`src/tasks/index.ts`](src/tasks/index.ts) and enqueue them with `payload.jobs.queue(...)`.
2. An `afterChange` hook on Payload's `payload-jobs` collection ([`src/lib/queue.ts`](src/lib/queue.ts)) pushes each new job's id (and its `waitUntil`) onto the `QUEUE` producer. A `waitUntil` timestamp becomes a Queue `delaySeconds` so delayed/scheduled jobs run at the right time. Cloudflare caps `delaySeconds` at 12 hours, so the consumer re-queues a job that arrives before it's due — chaining further delays for waits longer than 12h.
3. The Worker's queue consumer ([`src/worker.ts`](src/worker.ts) → `handlerQueue`) receives the message and calls `/api/payload-jobs/run` for that single job (across all queues) through the `WORKER_SELF_REFERENCE` binding. Successful runs are acked; failures `retry()` after a delay (up to `max_retries`).
4. Job-run requests are authorized by a shared `X-Payload-Secret` header, checked in [`src/access/jobs.ts`](src/access/jobs.ts) against `PAYLOAD_SECRET`.

Queue settings (batch size, timeout, retries) live in the `queues` block of [`wrangler.jsonc`](wrangler.jsonc). To run jobs you'll need the `payload-jobs-queue` Queue created (see [Provision Cloudflare resources](#3-provision-cloudflare-resources)).

## Scheduled jobs

Tasks and workflows can declare a `schedule` (a cron) so Payload queues them automatically — no manual `payload.jobs.queue(...)` call. Because Workers have no long-running process to keep a timer alive, the cron tick is driven by a [Cloudflare Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/). The flow:

1. Give a task a `schedule` in [`src/tasks/index.ts`](src/tasks/index.ts) (the included `heartbeat` task is an example). `scheduling` then turns on in Payload's jobs config.
2. The `triggers.crons` entry in [`wrangler.jsonc`](wrangler.jsonc) fires the Worker's `scheduled` handler ([`src/worker.ts`](src/worker.ts) → `handlerScheduled`).
3. That handler ([`src/lib/cron.ts`](src/lib/cron.ts)) calls Payload's built-in `/api/payload-jobs/handle-schedules?allQueues=true` endpoint through the `WORKER_SELF_REFERENCE` binding. The endpoint runs `payload.jobs.handleSchedules()`, which queues any task whose cron is now due.
4. Queued jobs flow through the exact same [background-jobs](#background-jobs) path — the `afterChange` hook dispatches them onto the Cloudflare Queue, and the consumer runs them. The cron only _queues_ due jobs; it never runs them inline, so there is one execution path.

The Cron Trigger interval is the **resolution** of scheduling: a task asking to run every minute can fire no more often than the trigger does (the default is every 5 minutes). Authorization reuses the same `X-Payload-Secret` header as job runs.

> **Note:** Cron Triggers only fire in deployed Workers, not under `next dev`. To exercise schedules locally, run `wrangler dev --test-scheduled` and hit `http://localhost:8787/cdn-cgi/handler/scheduled`, or simply `GET /api/payload-jobs/handle-schedules` with the `X-Payload-Secret` header.

## Email

Transactional email is sent through the Cloudflare `EMAIL` (`send_email`) binding via [`payload-email-cloudflare`](https://www.npmjs.com/package/payload-email-cloudflare), configured as Payload's `email` adapter in [`src/payload.config.ts`](src/payload.config.ts). Update `defaultFromAddress` / `defaultFromName` there for your app.

Templates are authored as [React Email](https://react.email) components in [`src/emails/`](src/emails/) ([`welcome.tsx`](src/emails/welcome.tsx) is included as a starting point). Render a template to HTML and pass it to `payload.sendEmail(...)`.

Preview templates locally with a live-reloading server:

```bash
pnpm email:dev   # http://localhost:3001
```

> **Note:** Cloudflare's `send_email` binding requires a verified sender / Email Routing to be configured for your domain in the Cloudflare dashboard before mail is delivered in production.

## Deployment

Set your production secrets, then deploy:

```bash
# Push secrets to the Worker (do this once, or whenever they change)
npx wrangler secret put PAYLOAD_SECRET

# Apply migrations to the remote D1 database
pnpm migrate:deploy

# Build with OpenNext and deploy to Cloudflare Workers
pnpm run deploy
```

To preview the production build locally in the Workers runtime before shipping:

```bash
pnpm preview
```

## Project structure

```
src/
├── app/
│   ├── (frontend)/         # Public Next.js site (App Router, RSC)
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Landing page — edit this to get started
│   │   └── globals.css
│   └── (payload)/          # Payload admin panel + REST/GraphQL routes
│       ├── admin/          # /admin dashboard (auto-generated)
│       └── api/            # /api, /api/graphql, /api/graphql-playground
├── access/                 # Payload access-control functions (collections, jobs)
├── collections/            # Payload collections (Users, Media)
├── components/ui/          # shadcn/ui components
├── db/                     # Drizzle schema + D1 client helper
├── emails/                 # React Email templates (welcome.tsx)
├── hooks/                  # React hooks
├── lib/
│   └── queue.ts            # Queue producer hook + Worker queue consumer
├── tasks/                  # Payload job task definitions
├── utils/
│   ├── cn.ts               # Tailwind class merge helper
│   └── context.ts          # Cloudflare context + production logger
├── payload.config.ts       # Payload configuration
└── worker.ts               # Cloudflare Worker entry (fetch handler + queue consumer)

migrations/                 # D1 SQL migrations
stubs/                      # Build-time-only module stubs for the Workers bundle
wrangler.jsonc              # Worker config + Cloudflare bindings
open-next.config.ts         # OpenNext (Cloudflare adapter) config
drizzle.config.ts           # Drizzle Kit config for D1 migrations
```

### Path aliases

| Alias             | Resolves to               |
| ----------------- | ------------------------- |
| `@/*`             | `./src/*`                 |
| `@payload-config` | `./src/payload.config.ts` |
| `@context`        | `./src/utils/context.ts`  |
| `@handler`        | `./.open-next/worker.js`  |

## Scripts

| Script                 | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `pnpm dev`             | Start the Next.js dev server                           |
| `pnpm email:dev`       | Preview React Email templates at http://localhost:3001 |
| `pnpm build`           | Build the Next.js app                                  |
| `pnpm preview`         | Build with OpenNext and preview in the Workers runtime |
| `pnpm deploy`          | Build with OpenNext and deploy to Cloudflare Workers   |
| `pnpm upload`          | Build and upload a new Worker version (no deploy)      |
| `pnpm lint`            | Run ESLint                                             |
| `pnpm typegen`         | Generate Payload types + admin import map              |
| `pnpm cf-typegen`      | Generate Cloudflare binding types                      |
| `pnpm generate:schema` | Generate the Drizzle schema from Payload               |
| `pnpm migrate:create`  | Create a new migration with Drizzle Kit                |
| `pnpm migrate:local`   | Apply migrations to local D1                           |
| `pnpm migrate:deploy`  | Apply migrations to remote D1                          |

## Adding a collection

1. Create a file in [`src/collections/`](src/collections/) (use [`users.ts`](src/collections/users.ts) or [`media.ts`](src/collections/media.ts) as a template).
2. Register it in the `collections` array of [`src/payload.config.ts`](src/payload.config.ts).
3. Run `pnpm typegen`, then generate and apply a migration (see [Database & migrations](#database--migrations)).

## Learn more

- [Payload CMS docs](https://payloadcms.com/docs)
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/)
- [Payload Jobs Queue](https://payloadcms.com/docs/jobs-queue/overview)
- [React Email](https://react.email)
- [Next.js docs](https://nextjs.org/docs)
