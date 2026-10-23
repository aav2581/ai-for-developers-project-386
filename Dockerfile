# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app
ENV HUSKY=0

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci

FROM deps AS backend-build
COPY apps/backend ./apps/backend
RUN ./node_modules/.bin/tsc -p apps/backend/tsconfig.build.json

FROM deps AS frontend-build
COPY apps/frontend ./apps/frontend
RUN npm run build -w @project/frontend

FROM node:24-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production
ENV HUSKY=0

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci --omit=dev --ignore-scripts --workspace @project/backend --include-workspace-root=false

COPY --from=backend-build /app/apps/backend/dist ./apps/backend/dist

USER node
EXPOSE 3000
CMD ["node", "apps/backend/dist/server.js"]

FROM nginx:1.29-alpine AS frontend

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
