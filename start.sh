#!/bin/sh
set -e

echo "🔄 Ejecutando migraciones de Prisma..."
pnpm prisma migrate deploy

echo "🌱 Ejecutando seed (si es necesario)..."
pnpm tsx prisma/seed.ts || echo "Seed ya ejecutado o falló"

echo "🚀 Iniciando aplicación..."
pnpm start
