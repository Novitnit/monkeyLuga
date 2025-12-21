FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN pnpm install --frozen-lockfile
# Build all workspace packages to ensure @isgame/shared is compiled
RUN pnpm -w -r build
RUN pnpm -C packages/client build

FROM nginx:alpine

COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
