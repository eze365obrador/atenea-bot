#!/bin/bash

echo "🧠 Creando Azure OpenAI..."

# Crear servicio Azure OpenAI
az cognitiveservices account create \
  --name atenea-openai \
  --resource-group rg-atenea-bot \
  --location westeurope \
  --kind OpenAI \
  --sku S0

# Desplegar modelo GPT-4o Mini
az cognitiveservices account deployment create \
  --name atenea-openai \
  --resource-group rg-atenea-bot \
  --deployment-name gpt-4o-mini \
  --model-name gpt-4o-mini \
  --model-version "2024-07-18" \
  --model-format OpenAI \
  --sku-name "GlobalStandard" \
  --sku-capacity 10

# Obtener API Key y guardarla
OPENAI_KEY=$(az cognitiveservices account keys list --name atenea-openai --resource-group rg-atenea-bot --query "key1" -o tsv)
echo "AZURE_OPENAI_API_KEY=$OPENAI_KEY" >> .env.temp

echo ""
echo "===== AZURE OPENAI KEY ====="
echo "$OPENAI_KEY"
echo "============================"
echo ""
echo "✅ Azure OpenAI creado correctamente"
echo "⚠️  La API Key también está guardada en .env.temp"