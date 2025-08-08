#!/bin/bash

echo "📱 Habilitando canal de Microsoft Teams..."

az bot msteams create --name atenea-bot-365 --resource-group rg-atenea-bot

echo "✅ Canal de Teams habilitado correctamente"