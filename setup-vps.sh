#!/bin/bash

# 🚀 Script de configuración inicial para VPS
# Este script configura todo lo necesario para el despliegue automático

set -e

echo "🚀 Configuración inicial de Generic Next en VPS"
echo "================================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Verificar si se está ejecutando como root
if [ "$EUID" -eq 0 ]; then 
    print_error "No ejecutes este script como root. Usa tu usuario normal."
    exit 1
fi

echo "1️⃣  Actualizando sistema..."
sudo apt update && sudo apt upgrade -y
print_success "Sistema actualizado"

echo ""
echo "2️⃣  Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_success "Docker instalado"
else
    print_info "Docker ya está instalado"
fi

echo ""
echo "3️⃣  Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt install docker-compose-plugin -y
    print_success "Docker Compose instalado"
else
    print_info "Docker Compose ya está instalado"
fi

echo ""
echo "4️⃣  Instalando Git..."
if ! command -v git &> /dev/null; then
    sudo apt install git -y
    print_success "Git instalado"
else
    print_info "Git ya está instalado"
fi

echo ""
echo "5️⃣  Configurando Git..."
read -p "Ingresa tu nombre para Git: " git_name
read -p "Ingresa tu email para Git: " git_email
git config --global user.name "$git_name"
git config --global user.email "$git_email"
print_success "Git configurado"

echo ""
echo "6️⃣  Generando clave SSH para GitHub Actions..."
if [ ! -f ~/.ssh/github_actions ]; then
    ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
    cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    print_success "Clave SSH generada"
else
    print_info "La clave SSH ya existe"
fi

echo ""
echo "7️⃣  Clonando repositorio..."
read -p "Ingresa la URL del repositorio (HTTPS o SSH): " repo_url
APP_DIR="$HOME/generic-next"

if [ -d "$APP_DIR" ]; then
    print_warning "El directorio $APP_DIR ya existe"
    read -p "¿Deseas eliminarlo y clonar de nuevo? (y/n): " confirm
    if [ "$confirm" = "y" ]; then
        rm -rf "$APP_DIR"
        git clone "$repo_url" "$APP_DIR"
        print_success "Repositorio clonado"
    else
        print_info "Usando directorio existente"
    fi
else
    git clone "$repo_url" "$APP_DIR"
    print_success "Repositorio clonado"
fi

echo ""
echo "8️⃣  Configurando variables de entorno..."
cd "$APP_DIR"

# Generar contraseña aleatoria para PostgreSQL
POSTGRES_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Generar JWT secret
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)

# Obtener IP pública
PUBLIC_IP=$(curl -s ifconfig.me)

cat > .env.production << EOF
# Database
DATABASE_URL="postgresql://postgres:${POSTGRES_PASS}@db:5432/generic_next"

# Security
JWT_SECRET="${JWT_SECRET}"

# PostgreSQL
POSTGRES_PASSWORD="${POSTGRES_PASS}"

# App
NEXT_PUBLIC_API_URL="http://${PUBLIC_IP}:3000"
NODE_ENV="production"
EOF

print_success "Variables de entorno configuradas"

echo ""
echo "9️⃣  Configurando firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    print_success "Firewall configurado"
else
    print_warning "UFW no está instalado, saltando configuración de firewall"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo "================================================"
echo ""
print_info "IMPORTANTE: Guarda esta información en GitHub Secrets"
echo ""
echo "📋 Información para GitHub Secrets:"
echo "-----------------------------------"
echo "VPS_HOST: $PUBLIC_IP"
echo "VPS_USER: $USER"
echo "VPS_PORT: 22"
echo "VPS_APP_PATH: $APP_DIR"
echo "POSTGRES_PASSWORD: $POSTGRES_PASS"
echo "JWT_SECRET: $JWT_SECRET"
echo "NEXT_PUBLIC_API_URL: http://$PUBLIC_IP:3000"
echo ""
echo "🔑 Clave SSH privada para VPS_SSH_KEY:"
echo "---------------------------------------"
cat ~/.ssh/github_actions
echo ""
echo "---------------------------------------"
echo ""
print_warning "Copia toda la clave SSH (incluyendo BEGIN y END) y guárdala en GitHub Secrets como VPS_SSH_KEY"
echo ""
print_info "Próximos pasos:"
echo "1. Ve a GitHub → Settings → Secrets → Actions"
echo "2. Agrega todos los secrets mostrados arriba"
echo "3. Haz push a la rama main para desplegar automáticamente"
echo ""
print_info "Para desplegar manualmente ahora:"
echo "cd $APP_DIR"
echo "docker-compose up -d --build"
echo ""
print_success "¡Todo listo! 🚀"
