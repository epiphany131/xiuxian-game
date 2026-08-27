FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY public ./public
COPY server ./server

RUN mkdir -p /app/server/data && chown -R node:node /app
USER node

EXPOSE 3000

VOLUME ["/app/server/data"]

CMD ["node", "server/server.js"]
