#!/bin/bash

echo "🚀 ATENEA BOT - CONFIGURACIÓN COMPLETA"
echo "======================================"

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
echo "Ejecutando configuración paso a paso..."
echo ""

# Ejecutar todos los scripts en orden
./scripts/1-setup-azure-providers.sh
echo ""

./scripts/2-create-resource-group.sh
echo ""

./scripts/3-create-app-registration.sh
echo ""

./scripts/4-create-bot-service.sh
echo ""

./scripts/5-enable-teams-channel.sh
echo ""

./scripts/6-create-azure-openai.sh
echo ""

./scripts/7-setup-env-file.sh
echo ""

echo "🎉 ¡CONFIGURACIÓN COMPLETA!"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Ejecutar: ./scripts/8-start-local-development.sh"
echo "2. En otra terminal: ngrok http 3978"
echo "3. Ejecutar: ./scripts/9-update-bot-endpoint.sh https://tu-url-ngrok.ngrok-free.app"
echo "4. Probar el bot en Microsoft Teams"
echo ""
echo "📄 Para distribuir en la organización, subir teams-manifest/atenea-teams.zip al Teams Admin Center"