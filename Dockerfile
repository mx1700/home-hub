FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:20-alpine
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build

# Create data directory for icons
RUN mkdir -p /data/icons

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data
ENV DOCKER_SOCKET=/var/run/docker.sock
ENV DOCKER_HOST_IP=host.docker.internal

WORKDIR /app
CMD ["npm", "run", "start"]
