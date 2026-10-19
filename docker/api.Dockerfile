FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@11.9.0
WORKDIR /app

FROM base AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/typescript-config/ packages/typescript-config/
COPY packages/eslint-config/ packages/eslint-config/
COPY apps/api/package.json apps/api/package.json
RUN pnpm --filter @cabinet/api... install --frozen-lockfile --child-concurrency=1 --network-concurrency=4
COPY apps/api/ apps/api/
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    NODE_OPTIONS=--max-old-space-size=768 pnpm --filter @cabinet/api build

FROM base AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ffmpeg \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/yt-dlp \
    && /opt/yt-dlp/bin/pip install --no-cache-dir yt-dlp
ENV PATH="/opt/yt-dlp/bin:${PATH}" NODE_ENV=production
COPY --from=build /app /app
# Keep source archives readable by the non-root runtime user, even with a restrictive host umask.
RUN chmod a+r /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml \
    && chmod -R a+rX /app/packages /app/apps/api \
    && chown -R node:node /app/apps/api
WORKDIR /app/apps/api
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
