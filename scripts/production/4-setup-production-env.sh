#!/bin/bash

echo "⚙️ Configurando variables de entorno en PRODUCCIÓN..."

# Verificar que existe .env.prod.temp
if [ ! -f ".env.prod.temp" ]; then
    echo "❌ Error: Archivo .env.prod.temp no encontrado. Ejecuta primero los scripts anteriores."
    exit 1
fi

# Leer credenciales del archivo temporal
source .env.prod.temp

# Obtener Azure OpenAI Key (reutilizamos la misma instancia)
OPENAI_KEY=$(az cognitiveservices account keys list --name atenea-openai --resource-group rg-atenea-bot --query "key1" -o tsv)

# Configurar variables de entorno en la Web App
az webapp config appsettings set \
  --name atenea-bot-prod \
  --resource-group rg-atenea-bot \
  --settings \
    MICROSOFT_APP_ID="$PROD_APP_ID" \
    MICROSOFT_APP_PASSWORD="$PROD_APP_SECRET" \
    MICROSOFT_APP_TYPE="MultiTenant" \
    MICROSOFT_APP_TENANT_ID="common" \
    BOT_DOMAIN="https://atenea-bot-prod.azurewebsites.net" \
    PORT="8080" \
    AZURE_OPENAI_API_KEY="$OPENAI_KEY" \
    AZURE_OPENAI_ENDPOINT="https://atenea-openai.openai.azure.com/" \
    AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-mini" \
    AZURE_OPENAI_API_VERSION="2024-02-15-preview" \
    NODE_ENV="production"

# Crear archivo .env.production local para referencia
cat > .env.production << EOF
# Azure Bot Configuration - PRODUCTION
MICROSOFT_APP_ID=$PROD_APP_ID
MICROSOFT_APP_PASSWORD=$PROD_APP_SECRET
MICROSOFT_APP_TYPE=MultiTenant
MICROSOFT_APP_TENANT_ID=common

# Bot Settings - PRODUCTION
BOT_DOMAIN=https://atenea-bot-prod.azurewebsites.net
PORT=8080

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=$OPENAI_KEY
AZURE_OPENAI_ENDPOINT=https://atenea-openai.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Environment
NODE_ENV=production

# APIs de Módulos (Configurar según tu backend)
VENTAS_API_URL=https://tu-api-ventas.com
VENTAS_API_KEY=tu-api-key-ventas
INCIDENCIAS_API_URL=https://tu-api-incidencias.com
INCIDENCIAS_API_KEY=tu-api-key-incidencias

# SharePoint Configuration (Microsoft Graph)
SHAREPOINT_TENANT_ID=tu-tenant-id
SHAREPOINT_CLIENT_ID=tu-client-id
SHAREPOINT_CLIENT_SECRET=tu-client-secret
SHAREPOINT_SITE_URL=https://tuempresa.sharepoint.com/sites/documentos
SHAREPOINT_DOCUMENTS_FOLDER=Shared Documents/Atenea

# ChromaDB Configuration
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
CHROMADB_COLLECTION_NAME=atenea_documents
EOF

# Limpiar archivo temporal
rm .env.prod.temp

echo "✅ Variables de entorno configuradas en Web App de producción"
echo "📄 Archivo .env.production creado para referencia local"