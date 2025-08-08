#!/bin/bash

echo "🚀 Iniciando desarrollo local..."

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Compilar proyecto
echo "🔨 Compilando proyecto..."
npm run build

# Iniciar bot en modo desarrollo
echo "▶️ Iniciando bot en puerto 3978..."
echo "🌐 Para exponer con ngrok, ejecuta en otra terminal: ngrok http 3978"
echo ""

npm run start:dev