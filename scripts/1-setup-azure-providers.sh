#!/bin/bash

echo "🔧 Configurando proveedores Azure..."

# Registrar proveedores necesarios
az provider register --namespace Microsoft.BotService --wait
az provider register --namespace Microsoft.Web --wait
az provider register --namespace Microsoft.CognitiveServices --wait

echo "✅ Proveedores Azure registrados correctamente"