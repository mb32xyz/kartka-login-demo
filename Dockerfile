FROM node:alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3030

RUN mkdir -p /app/db && chown -R node:node /app/db
USER node

ENV PORT=3030
CMD ["npm", "start"]
