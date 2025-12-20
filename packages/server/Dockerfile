FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable
COPY . .

# Install all workspace dependencies (including dev for TS build)
RUN pnpm install --frozen-lockfile
# Build all packages so @isgame/shared types/artifacts are available
RUN pnpm -w -r build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "packages/server/dist/index.js"]
