#!/bin/bash

echo "🤖 Creando Bot Service para PRODUCCIÓN..."

# Leer APP_ID del archivo temporal si existe
if [ -f ".env.prod.temp" ]; then
    source .env.prod.temp
fi

# Verificar que PROD_APP_ID esté disponible
if [ -z "$PROD_APP_ID" ]; then
    echo "❌ Error: PROD_APP_ID no encontrado. Ejecuta primero 1-create-production-app-registration.sh"
    exit 1
fi

# Crear Bot Service de producción
az bot create \
  --resource-group rg-atenea-bot \
  --name atenea-bot-prod \
  --appid $PROD_APP_ID \
  --sku F0 \
  --endpoint "https://atenea-bot-prod.azurewebsites.net/api/messages" \
  --app-type MultiTenant

# Cambiar display name
az bot update --name atenea-bot-prod --resource-group rg-atenea-bot --display-name "Atenea"

# Habilitar canal de Teams
az bot msteams create --name atenea-bot-prod --resource-group rg-atenea-bot

echo "✅ Bot de producción 'atenea-bot-prod' creado correctamente"