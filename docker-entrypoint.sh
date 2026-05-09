#!/bin/sh
set -e

echo "🔄 Esperando a que PostgreSQL esté listo..."
sleep 5

echo "🔄 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

echo "🌱 Ejecutando seed (opcional)..."
npx prisma db seed || echo "⚠️  Seed falló o no está configurado"

echo "🚀 Iniciando aplicación..."
exec node server.js
