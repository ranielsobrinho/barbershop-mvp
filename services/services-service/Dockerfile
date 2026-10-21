FROM node:22-alpine

WORKDIR /app

ENV TZ=UTC

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3003 5003

CMD ["node", "dist/main.js"]
