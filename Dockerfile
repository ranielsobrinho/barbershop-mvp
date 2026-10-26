FROM node:22-alpine

ENV TZ=UTC
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl python3 make g++ \
    && corepack enable

COPY . .

RUN pnpm install --frozen-lockfile \
    && DATABASE_URL=postgresql://barbershop:barbershop@postgres:5432/barbershop pnpm --filter @barbershop/prisma db:generate \
    && pnpm proto:generate \
    && pnpm build \
    && for service in services/*; do touch "$service/.env"; done

EXPOSE 3000 3001 3002 3003 3004 3005 3006 5001 5003 5173 8080

CMD ["pnpm", "--filter", "@barbershop/api-gateway", "start"]
