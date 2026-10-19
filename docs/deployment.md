# Backend deployment

Deploys the NestJS API, PostgreSQL 17, and Redis 7. The frontend is not included.

## Access before a domain is available

The API binds only to the VPS loopback interface. PostgreSQL and Redis have no published host ports. Do not publish login endpoints over plaintext HTTP.

Open a tunnel from your computer (keep this terminal running):

```sh
ssh -N -p 2222 \
  -L 14000:127.0.0.1:4000 \
  -L 4000:127.0.0.1:4000 \
  adminrekasandi@38.9.46.133
```

Then open:

- Health: http://localhost:14000/v1/health
- API docs: http://localhost:14000/api/docs

The additional `4000` forward handles the OAuth callbacks configured by `API_URL=http://localhost:4000`, including `http://localhost:4000/v1/auth/callback/google`. Keep any local API stopped while this forward uses port 4000. Register the exact callback URL in the provider console; copying OAuth credentials does not change the provider's allowed redirect URLs.

For a local frontend in production mode, create `apps/web/.env.production.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:14000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Keep the SSH tunnel running in one terminal, then run from the repository root in another terminal:

```sh
pnpm prod
```

This builds the frontend and its API-client dependency, then starts the frontend at http://localhost:3000. It does **not** start a local API, PostgreSQL, or Redis. Redis and the database remain on the VPS and are accessed only by the backend. Re-run `pnpm prod` after changing `NEXT_PUBLIC_API_URL`, because public variables are embedded at build time.

For frontend development with hot reload against the same production API, put `NEXT_PUBLIC_API_URL=http://localhost:14000` in `apps/web/.env.local` and run `pnpm --filter @cabinet/web dev`. Do not run the root `pnpm dev` for this setup: it also starts a local API. Both setups use real production data.

The trusted frontend origin is `http://localhost:3000`. Frontend and API share the `localhost` hostname for cookies; do not switch one of them to `127.0.0.1`.

## First deployment

Requires Docker Compose, Python 3, and a copy of the repository on the VPS. Commands below run from the repository root. Use `sudo docker` if your user does not have Docker socket access.

```sh
ADMIN_EMAIL=admin@example.com ADMIN_NAME=Admin python3 docker/init-env.py
# Creates docker/.env with random database, authentication, and admin secrets.
# It refuses to overwrite an existing environment file.

sudo docker compose --env-file docker/.env -f docker/compose.production.yml build api
sudo docker compose --env-file docker/.env -f docker/compose.production.yml up -d --wait postgres redis
sudo docker compose --env-file docker/.env -f docker/compose.production.yml run --rm --no-deps api pnpm exec prisma migrate deploy
sudo docker compose --env-file docker/.env -f docker/compose.production.yml run --rm seed
sudo docker compose --env-file docker/.env -f docker/compose.production.yml up -d --wait api
```

Read the generated `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `docker/.env` over SSH, and store them in your password manager. Never commit or paste the environment file into build logs. The seed creates/updates only that administrator's credential; running it again resets that credential to `ADMIN_PASSWORD`.

The image includes Prisma migration/seed tools, yt-dlp, and ffmpeg. The API runs as the non-root `node` user. Docker volumes preserve database data and queued jobs, services restart automatically, and container logs are rotated.

The migration chain retains historical Atlas tables. The schema-completion migration adds missing note and article fields without deleting existing tables or records. Do not use `prisma db push`, `migrate reset`, or `docker compose down -v` on this deployment.

## Verification

```sh
sudo docker compose --env-file docker/.env -f docker/compose.production.yml ps
curl --fail http://localhost:4000/v1/health

# The environment file generated above is safe to source; keep it private.
set -a
. ./docker/.env
set +a
python3 docker/smoke.py
```

The smoke check tests session login, protected routes, database queries, note save/read/delete, and logout. It creates and removes only its own temporary note. `python3 docker/test-init-env.py` checks secret generation and overwrite protection without accessing a database.

## Updates

Preserve `docker/.env` and the Docker volumes when updating source files. Set a unique `IMAGE_TAG` in the environment file before building so the previous image remains available for rollback.

```sh
sudo docker compose --env-file docker/.env -f docker/compose.production.yml build api
# Back up the database before applying migrations.
sudo docker compose --env-file docker/.env -f docker/compose.production.yml run --rm --no-deps api pnpm exec prisma migrate deploy
sudo docker compose --env-file docker/.env -f docker/compose.production.yml up -d --wait api
```

Do not rerun the seed for normal application updates. Reverting an image does not revert database migrations; review migration compatibility before rolling back.

## Backups

```sh
umask 077
mkdir -p ~/cabinet-backups
sudo docker compose --env-file docker/.env -f docker/compose.production.yml exec -T postgres \
  pg_dump -U cabinet -d cabinet -Fc > ~/cabinet-backups/cabinet-$(date +%Y%m%d-%H%M%S).dump
```

Keep encrypted copies off the VPS and regularly test restoring to a separate database. Docker volumes and a backup on the same VPS are not off-site backups. Also back up the environment file securely; the database dump does not contain deployment secrets.

## Public HTTPS later

Once a domain is available, place an HTTPS reverse proxy in front of `127.0.0.1:4000`. Set `API_URL` to the public HTTPS API origin and `FRONTEND_URL` to the exact frontend origin in `docker/.env`, configure `COOKIE_DOMAIN` only when sharing cookies between subdomains of the same domain, then recreate the API container. Keep PostgreSQL and Redis private. Configure provider callback URLs and secrets before enabling OAuth.
