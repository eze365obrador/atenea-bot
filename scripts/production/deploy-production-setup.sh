#!/bin/bash

echo "🚀 ATENEA BOT - CONFIGURACIÓN DE PRODUCCIÓN"
echo "============================================="

# Verificar Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI no encontrado. Instálalo primero."
    exit 1
fi

# Verificar login
if ! az account show &> /dev/null; then
    echo "🔐 Necesitas hacer login en Azure..."
    az login
fi

echo ""
echo "Creando entorno de PRODUCCIÓN..."
echo ""

# Ejecutar todos los scripts de producción en orden
./scripts/production/1-create-production-app-registration.sh
echo ""

./scripts/production/2-create-production-bot.sh
echo ""

./scripts/production/3-create-production-webapp.sh
echo ""

./scripts/production/4-setup-production-env.sh
echo ""

echo "🎉 ¡ENTORNO DE PRODUCCIÓN CREADO!"
echo ""
echo "📋 RECURSOS CREADOS:"
echo "- Bot Service: atenea-bot-prod"
echo "- Web App: atenea-bot-prod.azurewebsites.net"
echo "- App Registration: Atenea-Prod"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Configurar repositorio GitHub"
echo "2. Configurar GitHub Actions para CI/CD"
echo "3. Hacer primer deploy desde GitHub"
echo "4. Crear manifest de Teams para producción"
echo ""