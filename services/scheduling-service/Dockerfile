FROM node:22-alpine

WORKDIR /app

ENV TZ=UTC

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile || true

COPY . .

RUN npx tsc || true

EXPOSE 3002

CMD ["npx", "tsx", "src/main.ts"]
