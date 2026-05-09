# 🐳 Despliegue con Docker

## Requisitos previos

- Docker y Docker Compose instalados en tu VPS
- Puerto 3000 disponible (o modificar en docker-compose.yml)
- Al menos 1GB de RAM disponible

## 🚀 Despliegue rápido

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd generic-next
```

### 2. Configurar variables de entorno

```bash
cp .env.production.example .env.production
nano .env.production
```

**Importante:** Cambia estos valores:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD_SEGURO@db:5432/generic_next"
JWT_SECRET="genera-un-string-aleatorio-de-al-menos-32-caracteres"
POSTGRES_PASSWORD="TU_PASSWORD_SEGURO"
NEXT_PUBLIC_API_URL="http://TU_IP_VPS:3000"
```

### 3. Construir y levantar los contenedores

```bash
docker-compose up -d --build
```

### 4. Verificar que todo esté funcionando

```bash
# Ver logs
docker-compose logs -f app

# Verificar estado
docker-compose ps
```

### 5. Acceder a la aplicación

Abre tu navegador en: `http://TU_IP_VPS:3000`

**Credenciales por defecto:**
- Usuario: `admin`
- PIN: `123456`

⚠️ **Cambia estas credenciales inmediatamente después del primer login**

## 🔧 Comandos útiles

### Ver logs en tiempo real
```bash
docker-compose logs -f app
```

### Reiniciar la aplicación
```bash
docker-compose restart app
```

### Detener todo
```bash
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ BORRA LA BASE DE DATOS)
```bash
docker-compose down -v
```

### Actualizar la aplicación
```bash
git pull
docker-compose up -d --build
```

### Ejecutar migraciones manualmente
```bash
docker-compose exec app npx prisma migrate deploy
```

### Ejecutar seed manualmente
```bash
docker-compose exec app npx prisma db seed
```

### Acceder a la base de datos
```bash
docker-compose exec db psql -U postgres -d generic_next
```

## 🔒 Seguridad en producción

### 1. Usar HTTPS con Nginx reverse proxy

Instala Nginx y Certbot:

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Configura Nginx (`/etc/nginx/sites-available/generic-next`):

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilita el sitio y obtén certificado SSL:

```bash
sudo ln -s /etc/nginx/sites-available/generic-next /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d tu-dominio.com
```

### 2. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Backups automáticos de la base de datos

Crea un script de backup (`backup-db.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T db pg_dump -U postgres generic_next | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Mantener solo los últimos 7 días
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

Agrega a crontab (ejecutar diariamente a las 2 AM):

```bash
chmod +x backup-db.sh
crontab -e
# Agregar: 0 2 * * * /ruta/a/backup-db.sh
```

## 📊 Monitoreo

### Ver uso de recursos

```bash
docker stats
```

### Ver espacio en disco

```bash
docker system df
```

### Limpiar recursos no usados

```bash
docker system prune -a
```

## 🐛 Troubleshooting

### La app no inicia

```bash
# Ver logs detallados
docker-compose logs app

# Verificar que la DB esté lista
docker-compose exec db pg_isready -U postgres
```

### Error de conexión a la base de datos

```bash
# Verificar que los contenedores estén en la misma red
docker network inspect generic-next_app-network

# Reiniciar todo
docker-compose down
docker-compose up -d
```

### Migraciones fallan

```bash
# Ejecutar manualmente
docker-compose exec app npx prisma migrate deploy

# Si persiste, resetear (⚠️ BORRA DATOS)
docker-compose exec app npx prisma migrate reset --force
```

## 📝 Notas

- Los datos de PostgreSQL se persisten en un volumen Docker (`postgres_data`)
- Las migraciones se ejecutan automáticamente al iniciar el contenedor
- El seed se ejecuta solo si no hay datos en la base de datos
- Los logs se pueden ver con `docker-compose logs -f`

## 🆘 Soporte

Si tienes problemas, revisa:
1. Los logs: `docker-compose logs -f`
2. El estado de los contenedores: `docker-compose ps`
3. La conectividad de red: `docker network inspect generic-next_app-network`
