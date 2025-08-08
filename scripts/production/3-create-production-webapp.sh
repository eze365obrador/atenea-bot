#!/bin/bash

echo "🌐 Creando Web App para PRODUCCIÓN..."

# Crear App Service Plan para producción (B1 para mejor rendimiento)
az appservice plan create \
  --name asp-atenea-bot-prod \
  --resource-group rg-atenea-bot \
  --sku B1 \
  --is-linux

# Crear Web App de producción
az webapp create \
  --name atenea-bot-prod \
  --resource-group rg-atenea-bot \
  --plan asp-atenea-bot-prod \
  --runtime "NODE:20-lts"

# Configurar startup command
az webapp config set \
  --name atenea-bot-prod \
  --resource-group rg-atenea-bot \
  --startup-file "startup.sh"

echo "✅ Web App de producción 'atenea-bot-prod' creada correctamente"
echo "🌍 URL: https://atenea-bot-prod.azurewebsites.net"