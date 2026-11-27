FROM node:24.22.3-bookworm-slim
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.mjs tsconfig.json ./
COPY src src
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
