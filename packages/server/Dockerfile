# Server production Dockerfile (multi-stage)
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
# Build all workspace packages to ensure shared is compiled
RUN pnpm -w -r build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "packages/server/dist/index.js"]