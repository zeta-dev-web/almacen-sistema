#!/bin/sh
set -e

echo "DATABASE_URL=$DATABASE_URL"

echo "🔄 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

echo "🌱 Ejecutando seed (si es necesario)..."
pnpm tsx prisma/seed.ts || echo "Seed ya ejecutado o falló"

echo "🚀 Iniciando aplicación..."
pnpm start
