# 🚀 Configuración de Despliegue Automático con GitHub Actions

Esta guía te ayudará a configurar el despliegue automático de tu aplicación a tu VPS cada vez que hagas push a la rama `main`.

## 📋 Requisitos previos

- Una VPS con Ubuntu/Debian
- Docker y Docker Compose instalados en la VPS
- Acceso SSH a tu VPS
- Un repositorio en GitHub

## 🔧 Configuración en la VPS

### 1. Instalar Docker y Docker Compose

```bash
# Conectarse a la VPS
ssh usuario@tu-vps-ip

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Verificar instalación
docker --version
docker compose version
```

### 2. Configurar Git en la VPS

```bash
# Instalar Git
sudo apt install git -y

# Configurar Git
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### 3. Clonar el repositorio

```bash
# Crear directorio para la app
mkdir -p ~/generic-next
cd ~/generic-next

# Clonar el repositorio (usa HTTPS o SSH según tu preferencia)
git clone https://github.com/tu-usuario/tu-repo.git .

# O con SSH (recomendado)
git clone git@github.com:tu-usuario/tu-repo.git .
```

### 4. Generar clave SSH para GitHub Actions

```bash
# Generar nueva clave SSH (sin passphrase)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""

# Mostrar la clave privada (la necesitarás para GitHub)
cat ~/.ssh/github_actions

# Agregar la clave pública a authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**⚠️ IMPORTANTE:** Guarda la clave privada en un lugar seguro, la necesitarás para configurar GitHub Secrets.

## 🔐 Configuración de GitHub Secrets

Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions → New repository secret

Agrega los siguientes secrets:

### 1. `VPS_HOST`
```
Tu IP o dominio de la VPS
Ejemplo: 123.45.67.89
```

### 2. `VPS_USER`
```
Usuario SSH de tu VPS
Ejemplo: ubuntu
```

### 3. `VPS_SSH_KEY`
```
La clave privada SSH que generaste
(Todo el contenido de ~/.ssh/github_actions)
```

### 4. `VPS_PORT` (opcional)
```
Puerto SSH (por defecto: 22)
Ejemplo: 22
```

### 5. `VPS_APP_PATH` (opcional)
```
Ruta donde está la aplicación en la VPS
Por defecto: /home/$USER/generic-next
Ejemplo: /home/ubuntu/generic-next
```

### 6. `POSTGRES_PASSWORD`
```
Contraseña segura para PostgreSQL
Ejemplo: MiPasswordSuperSeguro123!
```

### 7. `JWT_SECRET`
```
String aleatorio de al menos 32 caracteres
Ejemplo: tu-jwt-secret-super-seguro-de-32-caracteres-minimo
```

### 8. `NEXT_PUBLIC_API_URL`
```
URL pública de tu aplicación
Ejemplo: http://123.45.67.89:3000
O con dominio: https://tu-dominio.com
```

## 📸 Captura de pantalla de ejemplo

Tus secrets deberían verse así:

```
VPS_HOST              = 123.45.67.89
VPS_USER              = ubuntu
VPS_SSH_KEY           = -----BEGIN OPENSSH PRIVATE KEY-----...
VPS_PORT              = 22
VPS_APP_PATH          = /home/ubuntu/generic-next
POSTGRES_PASSWORD     = MiPasswordSeguro123!
JWT_SECRET            = jwt-secret-de-32-caracteres-minimo
NEXT_PUBLIC_API_URL   = http://123.45.67.89:3000
```

## 🚀 Primer despliegue

### Opción 1: Despliegue manual desde la VPS

```bash
# Conectarse a la VPS
ssh usuario@tu-vps-ip

# Ir al directorio de la app
cd ~/generic-next

# Crear archivo .env.production
cat > .env.production << EOF
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db:5432/generic_next"
JWT_SECRET="tu-jwt-secret-de-32-caracteres"
POSTGRES_PASSWORD="TU_PASSWORD"
NEXT_PUBLIC_API_URL="http://TU_IP:3000"
NODE_ENV="production"
EOF

# Levantar los contenedores
docker-compose up -d --build

# Ver logs
docker-compose logs -f app
```

### Opción 2: Despliegue desde GitHub Actions

1. Ve a tu repositorio en GitHub
2. Actions → Deploy to VPS → Run workflow
3. Selecciona la rama `main` y haz clic en "Run workflow"

## 🔄 Despliegue automático

Una vez configurado, cada vez que hagas push a `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

GitHub Actions automáticamente:
1. ✅ Se conectará a tu VPS
2. ✅ Actualizará el código desde GitHub
3. ✅ Configurará las variables de entorno
4. ✅ Detendrá los contenedores anteriores
5. ✅ Construirá la nueva imagen
6. ✅ Levantará los contenedores
7. ✅ Ejecutará las migraciones de Prisma
8. ✅ Mostrará los logs

## 📊 Monitorear el despliegue

### Ver el progreso en GitHub

1. Ve a tu repositorio
2. Haz clic en "Actions"
3. Verás el workflow ejecutándose en tiempo real

### Ver logs en la VPS

```bash
# Conectarse a la VPS
ssh usuario@tu-vps-ip

# Ver logs de la aplicación
cd ~/generic-next
docker-compose logs -f app

# Ver estado de los contenedores
docker-compose ps
```

## 🔒 Seguridad adicional

### 1. Cambiar puerto SSH (recomendado)

```bash
# Editar configuración SSH
sudo nano /etc/ssh/sshd_config

# Cambiar línea:
Port 2222  # O cualquier puerto > 1024

# Reiniciar SSH
sudo systemctl restart sshd
```

No olvides actualizar el secret `VPS_PORT` en GitHub.

### 2. Configurar firewall

```bash
# Permitir SSH (usa tu puerto personalizado)
sudo ufw allow 2222/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable
```

### 3. Configurar Nginx con SSL (recomendado)

Ver la guía completa en `DOCKER.md`

## 🐛 Troubleshooting

### Error: "Permission denied (publickey)"

```bash
# Verificar que la clave SSH esté en authorized_keys
cat ~/.ssh/authorized_keys

# Verificar permisos
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Error: "docker: command not found"

```bash
# Verificar que el usuario esté en el grupo docker
groups

# Si no está, agregarlo
sudo usermod -aG docker $USER

# Cerrar sesión y volver a conectar
exit
ssh usuario@tu-vps-ip
```

### Error: "git: command not found"

```bash
# Instalar Git
sudo apt update
sudo apt install git -y
```

### El workflow falla en "Actualizando código"

```bash
# Verificar que el repositorio esté clonado
cd ~/generic-next
git status

# Si no existe, clonarlo
cd ~
git clone https://github.com/tu-usuario/tu-repo.git generic-next
```

### Los contenedores no inician

```bash
# Ver logs detallados
docker-compose logs

# Verificar que Docker esté corriendo
sudo systemctl status docker

# Reiniciar Docker
sudo systemctl restart docker
```

## 📝 Comandos útiles

### En la VPS

```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Reiniciar la aplicación
docker-compose restart app

# Ver estado
docker-compose ps

# Ejecutar migraciones manualmente
docker-compose exec app npx prisma migrate deploy

# Acceder a la base de datos
docker-compose exec db psql -U postgres -d generic_next

# Ver uso de recursos
docker stats
```

### Desde GitHub

```bash
# Desplegar manualmente
# Ve a Actions → Deploy to VPS → Run workflow

# Ver logs del último despliegue
# Ve a Actions → Último workflow → Ver detalles
```

## 🎉 ¡Listo!

Tu aplicación ahora se despliega automáticamente cada vez que haces push a `main`.

Accede a tu aplicación en: `http://TU_IP_VPS:3000`

**Credenciales por defecto:**
- Usuario: `admin`
- PIN: `123456`

⚠️ **Cambia estas credenciales inmediatamente**

## 📚 Recursos adicionales

- [Documentación de Docker](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Guía de Docker](./DOCKER.md)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
