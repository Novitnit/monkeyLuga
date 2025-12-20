FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm -w -r build
