#!/bin/bash

# Verificar que se proporcione la URL de ngrok
if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la URL de ngrok"
    echo "Uso: $0 https://tu-url-ngrok.ngrok-free.app"
    exit 1
fi

NGROK_URL=$1
echo "🔗 Actualizando endpoint del bot con: $NGROK_URL"

# Actualizar endpoint del bot
az bot update \
  --name atenea-bot-365 \
  --resource-group rg-atenea-bot \
  --endpoint "$NGROK_URL/api/messages"

echo "✅ Endpoint del bot actualizado correctamente"
echo "🎯 Ahora puedes probar el bot en Microsoft Teams"