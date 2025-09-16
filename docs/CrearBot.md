# Crear Nuevo Bot Atenea - Paso a Paso

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener:
- Azure CLI instalado y configurado
- Node.js 20 LTS instalado
- ngrok instalado (para desarrollo local)

```bash
# Verificar instalaciones
az --version
node --version
ngrok version
```

## 🚀 Opción 1: Configuración Automática (Recomendado)

**Ejecuta un solo comando para crear todo:**

```bash
./scripts/deploy-complete-setup.sh
```

Este script ejecutará automáticamente todos los pasos necesarios.

## ⚙️ Opción 2: Configuración Manual Paso a Paso

### Paso 1: Login en Azure
```bash
az login
```

### Paso 2: Registrar Proveedores Azure
```bash
./scripts/1-setup-azure-providers.sh
```

### Paso 3: Crear Resource Group
```bash
./scripts/2-create-resource-group.sh
```

### Paso 4: Crear App Registration
```bash
./scripts/3-create-app-registration.sh
```

### Paso 5: Crear Azure Bot Service
```bash
./scripts/4-create-bot-service.sh
```

### Paso 6: Habilitar Canal de Teams
```bash
./scripts/5-enable-teams-channel.sh
```

### Paso 7: Crear Azure OpenAI
```bash
./scripts/6-create-azure-openai.sh
```

### Paso 8: Configurar Variables de Entorno
```bash
./scripts/7-setup-env-file.sh
```

## 💻 Desarrollo Local

### Paso 9: Iniciar Desarrollo Local
```bash
./scripts/8-start-local-development.sh
```

### Paso 10: Exponer con ngrok
En otra terminal:
```bash
ngrok http 3978
```

### Paso 11: Actualizar Endpoint del Bot
```bash
./scripts/9-update-bot-endpoint.sh https://TU-URL-NGROK.ngrok-free.app
```

## ✅ Paso 14: Probar en Teams

1. Ve al [Portal de Azure](https://portal.azure.com)
2. Busca "atenea-bot-365" en tus recursos
3. Ve a "Channels" → "Microsoft Teams"
4. Haz clic en "Open in Teams"
5. ¡Prueba enviando un mensaje!

## 🎯 Comandos de Verificación

```bash
# Verificar que el bot está corriendo
curl http://localhost:3978/api/messages

# Verificar recursos en Azure
az resource list --resource-group rg-atenea-bot --output table

# Ver logs del bot
# (En la terminal donde corre npm run start:dev)
```

## 📝 Notas Importantes

1. **Guarda las credenciales**: App ID, App Secret, y OpenAI Key son críticos
2. **ngrok**: Cada vez que reinicies ngrok, debes actualizar el endpoint del bot
3. **Puerto**: El bot debe correr en puerto 3978 para que coincida con la configuración
4. **Variables de entorno**: Asegúrate de que el archivo `.env` tenga todas las variables

## 🔄 Para Desarrollo Diario

```bash
# 1. Iniciar bot
npm run start:dev

# 2. En otra terminal, iniciar ngrok
ngrok http 3978

# 3. Si cambió la URL de ngrok, actualizar bot
az bot update --name atenea-bot-365 --resource-group rg-atenea-bot --endpoint "https://24ca4fbc4182.ngrok-free.app/api/messages"
```

## ✨ Resultado Final

Después de seguir todos estos pasos:
- ✅ Bot creado en Azure
- ✅ Teams channel habilitado
- ✅ Azure OpenAI configurado
- ✅ Código funcionando localmente
- ✅ Bot respondiendo en Microsoft Teams

¡Tu nuevo bot Atenea está listo para usar!