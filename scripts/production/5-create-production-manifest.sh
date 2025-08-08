#!/bin/bash

echo "📱 Creando manifest de Teams para PRODUCCIÓN..."

# Obtener el App ID de producción desde Azure
PROD_APP_ID=$(az bot show --name atenea-bot-prod --resource-group rg-atenea-bot --query "properties.msaAppId" -o tsv)

if [ -z "$PROD_APP_ID" ]; then
    echo "❌ Error: No se pudo obtener el App ID de producción. ¿Existe el bot atenea-bot-prod?"
    exit 1
fi

echo "App ID de producción encontrado: $PROD_APP_ID"

# Actualizar manifest.json con el App ID real
sed "s/PRODUCTION_APP_ID_PLACEHOLDER/$PROD_APP_ID/g" teams-manifest-production/manifest.json > teams-manifest-production/manifest-updated.json
mv teams-manifest-production/manifest-updated.json teams-manifest-production/manifest.json

# Crear paquete de Teams para producción
cd teams-manifest-production
zip -r atenea-teams-production.zip manifest.json color.png outline.png
cd ..

echo "✅ Manifest de producción creado correctamente"
echo "📦 Paquete: teams-manifest-production/atenea-teams-production.zip"
echo "🔑 App ID: $PROD_APP_ID"