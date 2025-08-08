#!/bin/bash

echo "🤖 Creando Azure Bot Service..."

# Leer APP_ID del archivo temporal si existe
if [ -f ".env.temp" ]; then
    source .env.temp
fi

# Verificar que APP_ID esté disponible
if [ -z "$APP_ID" ]; then
    echo "❌ Error: APP_ID no encontrado. Ejecuta primero el script 3-create-app-registration.sh"
    exit 1
fi

# Crear Bot Service
az bot create \
  --resource-group rg-atenea-bot \
  --name atenea-bot-365 \
  --appid $APP_ID \
  --sku F0 \
  --endpoint "https://temp-endpoint.com/api/messages" \
  --app-type MultiTenant

# Cambiar display name
az bot update --name atenea-bot-365 --resource-group rg-atenea-bot --display-name "Atenea"

echo "✅ Bot Service 'atenea-bot-365' creado correctamente"