#!/bin/bash

echo "🔑 Creando App Registration..."

# Crear aplicación en Azure AD
APP_INFO=$(az ad app create --display-name "Atenea" --sign-in-audience AzureADMyOrg)
APP_ID=$(echo $APP_INFO | jq -r '.appId')

# Crear secret para la aplicación
SECRET_INFO=$(az ad app credential reset --id $APP_ID --years 2)
APP_SECRET=$(echo $SECRET_INFO | jq -r '.password')

# Guardar credenciales en archivo temporal
echo "APP_ID=$APP_ID" > .env.temp
echo "APP_SECRET=$APP_SECRET" >> .env.temp

# Mostrar credenciales
echo ""
echo "===== CREDENCIALES DEL BOT ====="
echo "App ID: $APP_ID"
echo "App Secret: $APP_SECRET"
echo "================================="
echo ""
echo "⚠️  IMPORTANTE: Guarda estas credenciales. También están en .env.temp"
echo ""

export APP_ID
export APP_SECRET