FROM node:20-alpine

LABEL org.opencontainers.image.title="Circuit Breaker Sync"
LABEL org.opencontainers.image.description="Self-hosted sync server for Circuit Breaker"
LABEL org.opencontainers.image.url="https://circuitbreaker.app"
LABEL org.opencontainers.image.source="https://github.com/BlockBuilderJoe/circuit-breaker"
LABEL org.opencontainers.image.vendor="josephpalmer"

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /data

ENV PORT=8787
ENV DB_PATH=/data/circuitbreaker.db

EXPOSE 8787

CMD ["node", "node-entry.js"]
