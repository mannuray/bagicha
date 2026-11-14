# Bagicha API for Render (docs/deploy.md). Migrations are NOT run here: they run
# from the laptop (the `migrate` target) before main is pushed, so a new image
# never meets an old schema.
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# prisma.config.ts needs DATABASE_URL to load; generate never connects, so a placeholder is enough.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npx prisma generate && npm run build

# docker build --target migrate -t bagicha-migrate . ; then run it with DATABASE_URL set.
FROM build AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# The plant catalogue push (after the migration, before the deploy): writes the
# seed files in src/modules/catalogue/seed to the database.
# docker build --target catalogue-push -t bagicha-catalogue-push . ; run with DATABASE_URL set.
FROM build AS catalogue-push
CMD ["node", "dist/modules/catalogue/push/push.main.js"]

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=staging
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
RUN npm prune --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
# Not root: the app only reads its files (owned by root) and writes to stdout.
USER node
CMD ["node", "--require", "./dist/instrumentation.js", "dist/main"]
