# ---- Dependencies stage ----
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

# Instala solo dependencias de producción
RUN npm ci --omit=dev

# ---- Runtime stage ----
FROM node:20-alpine AS runtime

# Crear usuario no root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copiar node_modules desde stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY index.js .
COPY package.json .

ENV NODE_ENV=production
ENV PORT=3000

USER appuser

EXPOSE 3000

# Healthcheck compatible con alpine
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "index.js"]