#!/bin/bash

echo "🔑 Creando App Registration para PRODUCCIÓN..."

# Crear aplicación en Azure AD para producción
APP_INFO=$(az ad app create --display-name "Atenea-Prod" --sign-in-audience AzureADMyOrg)
APP_ID=$(echo $APP_INFO | jq -r '.appId')

# Crear secret para la aplicación
SECRET_INFO=$(az ad app credential reset --id $APP_ID --years 2)
APP_SECRET=$(echo $SECRET_INFO | jq -r '.password')

# Guardar credenciales en archivo temporal
echo "PROD_APP_ID=$APP_ID" > .env.prod.temp
echo "PROD_APP_SECRET=$APP_SECRET" >> .env.prod.temp

# Mostrar credenciales
echo ""
echo "===== CREDENCIALES PRODUCCIÓN ====="
echo "App ID: $APP_ID"
echo "App Secret: $APP_SECRET"
echo "===================================="
echo ""
echo "⚠️  IMPORTANTE: Guarda estas credenciales. También están en .env.prod.temp"
echo ""

export PROD_APP_ID=$APP_ID
export PROD_APP_SECRET=$APP_SECRET