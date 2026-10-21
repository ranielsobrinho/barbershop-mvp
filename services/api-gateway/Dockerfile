FROM node:22-alpine

WORKDIR /app

ENV TZ=UTC

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/main.js"]
