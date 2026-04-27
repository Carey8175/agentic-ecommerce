FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --shamefully-hoist
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm@10
COPY --from=builder /app .
EXPOSE 9001
CMD ["pnpm", "start"]
