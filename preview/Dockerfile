FROM eclipse-temurin:25-jdk AS java
FROM node:26-bookworm-slim AS build
COPY --from=java /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="/opt/java/openjdk/bin:${PATH}"
WORKDIR /app
RUN npm install --global pnpm@12.14.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm render && pnpm check && pnpm exec astro build

FROM node:26-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.cache/previews ./.cache/previews
COPY --from=build /app/.cache/resources ./.cache/resources
COPY --from=build /app/.cache/manifest.json ./.cache/manifest.json
USER node
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
