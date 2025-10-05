FROM node:22-alpine3.21 AS BUILD
WORKDIR /app
COPY . .
RUN npm ci --omit=dev

FROM node:22-alpine3.21
RUN apk --update --no-cache add curl && apk add curl && apk add --no-cache tor  \
    && apk del --no-cache wget && apk del --no-cache py-pip  \
    && rm -f /sbin/apk && rm -rf /etc/apk && rm -rf /lib/apk && rm -rf /usr/share/apk  \
    && rm -rf /var/lib/apk && rm -rf /var/cache/apk/*

WORKDIR /app
COPY --from=BUILD --chown=1000:1000 /app/app.js ./
COPY --from=BUILD --chown=1000:1000 /app/bin ./bin
COPY --from=BUILD --chown=1000:1000 /app/node_modules ./node_modules
COPY --from=BUILD --chown=1000:1000 /app/package*.json ./
COPY --from=BUILD --chown=1000:1000 /app/public ./public
COPY --from=BUILD --chown=1000:1000 /app/routes ./routes
COPY --from=BUILD --chown=1000:1000 /app/services ./services
COPY --from=BUILD --chown=1000:1000 /app/views ./views

ARG DB_FOLDER
RUN mkdir -p ${DB_FOLDER} && chown -R node:node ${DB_FOLDER} # permissions fix

ENV PORT=3030
ENV NODE_ENV=production
USER node
CMD ["npm", "run", "start"]
