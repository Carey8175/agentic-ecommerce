FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache ca-certificates
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
RUN mkdir -p src/uploads
EXPOSE 3001
CMD ["node", "dist/server.js"]
