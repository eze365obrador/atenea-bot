#!/bin/bash

echo "🔐 Configurando GitHub Secrets para CI/CD..."

# Verificar que GitHub CLI esté instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI no encontrado."
    echo "Instálalo con: brew install gh"
    echo "Luego ejecuta: gh auth login"
    exit 1
fi

# Verificar login en GitHub
if ! gh auth status &> /dev/null; then
    echo "🔐 Necesitas hacer login en GitHub..."
    gh auth login
fi

echo "Obteniendo credenciales de Azure..."

# Obtener información de la suscripción
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

# Crear Service Principal para GitHub Actions
echo "Creando Service Principal para GitHub Actions..."
SP_OUTPUT=$(az ad sp create-for-rbac --name "github-actions-atenea" --role contributor --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-atenea-bot" --sdk-auth)

echo "Configurando secretos en GitHub..."

# Configurar AZURE_CREDENTIALS secret
echo "$SP_OUTPUT" | gh secret set AZURE_CREDENTIALS

echo "✅ Secretos configurados correctamente en GitHub"
echo ""
echo "📋 Secretos creados:"
echo "- AZURE_CREDENTIALS: Para autenticación con Azure"
echo ""
echo "🚀 Ya puedes hacer push a main para desplegar automáticamente"