FROM --platform=amd64 node:18-alpine As base

FROM base AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update
# Set working directory
WORKDIR /app
RUN npm install --global turbo
COPY --chown=node:node . .
RUN turbo prune @virgile/backend --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --chown=node:node --from=builder /app/out/json/ .
COPY --chown=node:node --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Uncomment and use build args to enable remote caching
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM

ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN
ENV TZ=Europe/Paris
ENV NODE_ENV="production"

ADD backend/prisma backend/prisma
RUN cd backend && npx prisma generate

RUN npm run build

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 remix-api
USER remix-api

# ENV TZ=Europe/Paris
# ENV NODE_ENV="production"

COPY --chown=remix-api:nodejs --from=installer /app/backend/package.json ./backend/package.json
COPY --chown=remix-api:nodejs --from=installer /app/backend/dist ./backend/dist
COPY --chown=remix-api:nodejs --from=installer /app/node_modules ./node_modules
COPY --chown=remix-api:nodejs --from=installer /app/node_modules/@virgile/frontend ./node_modules/@virgile/frontend
COPY --chown=remix-api:nodejs --from=installer /app/node_modules/@virgile/typescript-config ./node_modules/@virgile/typescript-config
COPY --chown=remix-api:nodejs --from=installer /app/node_modules/@virgile/eslint-config ./node_modules/@virgile/eslint-config
COPY --chown=remix-api:nodejs --from=installer /app/backend/prisma ./backend/prisma

COPY --chown=remix-api:nodejs --from=builder /app/backend/start.sh ./backend/start.sh

ENTRYPOINT [ "backend/start.sh" ]