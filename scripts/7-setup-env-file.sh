#!/bin/bash

echo "⚙️ Configurando archivo .env..."

# Verificar que existe .env.temp
if [ ! -f ".env.temp" ]; then
    echo "❌ Error: Archivo .env.temp no encontrado. Ejecuta primero los scripts anteriores."
    exit 1
fi

# Leer credenciales del archivo temporal
source .env.temp

# Crear archivo .env completo
cat > .env << EOF
# Azure Bot Configuration
MICROSOFT_APP_ID=$APP_ID
MICROSOFT_APP_PASSWORD=$APP_SECRET
MICROSOFT_APP_TYPE=MultiTenant
MICROSOFT_APP_TENANT_ID=common

# Bot Settings
BOT_DOMAIN=https://atenea-bot-365.azurewebsites.net
PORT=3978

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=$AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT=https://atenea-openai.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-15-preview

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

# Azure Settings
AZURE_SUBSCRIPTION_ID=d0b3f357-2031-47d6-8925-48af750b2522
AZURE_RESOURCE_GROUP=rg-atenea-bot
AZURE_BOT_NAME=atenea-bot-365
EOF

# Limpiar archivo temporal
rm .env.temp

echo "✅ Archivo .env creado correctamente"
echo "⚠️  Recuerda configurar las URLs de tus APIs en el archivo .env"