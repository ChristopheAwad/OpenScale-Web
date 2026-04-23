FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV DATA_DIR=/app/data

RUN apk add --no-cache python3 make g++

RUN npm rebuild better-sqlite3 --build-from-source

RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/data /app/uploads && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["node", "build"]