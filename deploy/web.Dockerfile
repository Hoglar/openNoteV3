FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html tsconfig*.json vite.config.ts playwright.config.ts ./
COPY src/ ./src/
COPY public/ ./public/
COPY tests/ ./tests/
RUN npm run build

FROM caddy:2.11.9-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/ /srv/
