#!/bin/bash

echo "🚀 ATENEA BOT - SETUP COMPLETO DE ENTORNOS"
echo "==========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar prerrequisitos
print_step "Verificando prerrequisitos..."

if ! command -v az &> /dev/null; then
    print_error "Azure CLI no encontrado. Instálalo primero."
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js no encontrado. Instálalo primero."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm no encontrado. Instálalo primero."
    exit 1
fi

print_success "Prerrequisitos verificados"

# Login Azure
print_step "Verificando login Azure..."
if ! az account show &> /dev/null; then
    print_warning "Necesitas hacer login en Azure..."
    az login
fi
print_success "Azure login verificado"

echo ""
print_step "OPCIÓN 1: SETUP COMPLETO (Desarrollo + Producción)"
print_step "OPCIÓN 2: Solo Desarrollo"
print_step "OPCIÓN 3: Solo Producción"
echo ""

read -p "Selecciona una opción (1/2/3): " option

case $option in
    1)
        echo ""
        print_step "=== CREANDO ENTORNO DE DESARROLLO ==="
        ./scripts/deploy-complete-setup.sh
        
        echo ""
        print_step "=== CREANDO ENTORNO DE PRODUCCIÓN ==="
        ./scripts/production/deploy-production-setup.sh
        
        echo ""
        print_step "=== CREANDO MANIFEST DE PRODUCCIÓN ==="
        ./scripts/production/5-create-production-manifest.sh
        
        echo ""
        print_step "🎉 SETUP COMPLETO TERMINADO!"
        echo ""
        print_success "ENTORNOS CREADOS:"
        echo "  - Desarrollo: atenea-bot-365 (local + ngrok)"
        echo "  - Producción: atenea-bot-prod (Azure Web App)"
        echo ""
        print_warning "PRÓXIMOS PASOS:"
        echo "  1. Configurar repositorio GitHub:"
        echo "     git init && git add . && git commit -m 'Initial commit'"
        echo "     gh repo create atenea-bot --public"
        echo "  2. Configurar GitHub Secrets:"
        echo "     ./scripts/github/setup-github-secrets.sh"
        echo "  3. Push a main para primer deploy:"
        echo "     git push -u origin main"
        ;;
        
    2)
        echo ""
        print_step "=== CREANDO ENTORNO DE DESARROLLO ==="
        ./scripts/deploy-complete-setup.sh
        
        echo ""
        print_step "🎉 ENTORNO DE DESARROLLO LISTO!"
        echo ""
        print_warning "PRÓXIMOS PASOS:"
        echo "  1. Iniciar desarrollo local:"
        echo "     ./scripts/8-start-local-development.sh"
        echo "  2. En otra terminal, exponer con ngrok:"
        echo "     ngrok http 3978"
        echo "  3. Actualizar endpoint:"
        echo "     ./scripts/9-update-bot-endpoint.sh https://tu-ngrok.ngrok-free.app"
        ;;
        
    3)
        echo ""
        print_step "=== CREANDO ENTORNO DE PRODUCCIÓN ==="
        ./scripts/production/deploy-production-setup.sh
        ./scripts/production/5-create-production-manifest.sh
        
        echo ""
        print_step "🎉 ENTORNO DE PRODUCCIÓN LISTO!"
        echo ""
        print_warning "PRÓXIMOS PASOS:"
        echo "  1. Configurar GitHub Secrets:"
        echo "     ./scripts/github/setup-github-secrets.sh"
        echo "  2. Push código a main para deploy automático"
        ;;
        
    *)
        print_error "Opción inválida. Usa 1, 2 o 3."
        exit 1
        ;;
esac

echo ""
print_success "Consulta la documentación completa en docs/PRODUCTION-SETUP.md"