# Storefront + admin panel + REST API in one container (see server.js).
FROM node:20-alpine
WORKDIR /srv

COPY package*.json ./
RUN npm ci

COPY . .
# NEXT_PUBLIC_* values are baked into the build: pass the live domain as a build arg.
ARG NEXT_PUBLIC_SITE_URL=https://tahrio.pk
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

ENV NODE_ENV=production PORT=3000 DATA_DIR=/var/data
EXPOSE 3000
CMD ["node", "server.js"]
