# Atenea Bot - Setup de Producción con CI/CD

## 🏗️ Arquitectura

### Entornos:
- **Desarrollo**: Bot local con ngrok (`atenea-bot-365`)
- **Producción**: Azure Web App con CI/CD (`atenea-bot-prod`)

### CI/CD Pipeline:
- **Branch `main`** → Deploy automático a producción
- **Pull Requests** → Tests automáticos
- **GitHub Actions** → Deployment pipeline

## 🚀 Configuración Inicial

### 1. Crear Entorno de Producción

```bash
# Ejecutar setup completo de producción
./scripts/production/deploy-production-setup.sh
```

Este script crea:
- ✅ App Registration de producción
- ✅ Bot Service de producción  
- ✅ Web App de producción
- ✅ Variables de entorno configuradas

### 2. Configurar Repositorio GitHub

```bash
# Inicializar git si no existe
git init
git add .
git commit -m "Initial commit"

# Crear repositorio en GitHub y conectar
gh repo create atenea-bot --public
git remote add origin https://github.com/TU-USUARIO/atenea-bot.git
git push -u origin main
```

### 3. Configurar Secretos de GitHub

```bash
# Configurar autenticación con Azure
./scripts/github/setup-github-secrets.sh
```

### 4. Crear Manifest de Teams para Producción

```bash
# Generar manifest con App ID real
./scripts/production/5-create-production-manifest.sh
```

## 🔄 Workflow de Desarrollo

### Desarrollo Local:
```bash
# 1. Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar localmente
./scripts/8-start-local-development.sh

# 3. Exponer con ngrok (otra terminal)
ngrok http 3978

# 4. Actualizar endpoint de desarrollo
./scripts/9-update-bot-endpoint.sh https://tu-ngrok.ngrok-free.app
```

### Deploy a Producción:
```bash
# 1. Crear Pull Request
git push origin feature/nueva-funcionalidad
gh pr create --title "Nueva funcionalidad" --body "Descripción"

# 2. GitHub Actions ejecuta tests automáticamente
# 3. Revisar y hacer merge del PR

# 4. Deploy automático a producción
git checkout main
git pull origin main
# GitHub Actions despliega automáticamente
```

## 📦 Recursos Creados

### Azure Resources:
- **rg-atenea-bot**: Resource Group
- **atenea-bot-365**: Bot de desarrollo
- **atenea-bot-prod**: Bot de producción  
- **atenea-bot-prod**: Web App de producción
- **asp-atenea-bot-prod**: App Service Plan (B1)
- **atenea-openai**: Azure OpenAI (compartido)

### GitHub:
- **Repository**: Código fuente
- **Actions**: CI/CD pipelines
- **Secrets**: Credenciales Azure

### Teams:
- **Development**: `teams-manifest/atenea-teams.zip`
- **Production**: `teams-manifest-production/atenea-teams-production.zip`

## 🔧 Variables de Entorno

### Desarrollo (.env):
```
MICROSOFT_APP_ID=7ef1434c-efca-45b3-a285-771be3d57bfa
PORT=3978
NODE_ENV=development
```

### Producción (Azure Web App):
```
MICROSOFT_APP_ID=[PRODUCTION_APP_ID]
PORT=8080  
NODE_ENV=production
```

## 📊 Monitoring

### Logs de Producción:
```bash
# Ver logs en tiempo real
az webapp log tail --name atenea-bot-prod --resource-group rg-atenea-bot

# Descargar logs
az webapp log download --name atenea-bot-prod --resource-group rg-atenea-bot
```

### GitHub Actions:
- Ve a tu repositorio → **Actions** tab
- Monitorea deploys y tests

## 🛡️ Seguridad

- ✅ **Service Principal** con permisos mínimos
- ✅ **Secrets** encriptados en GitHub
- ✅ **Branch protection** en main
- ✅ **Tests automáticos** antes de deploy

## 📱 Distribución Teams

### Desarrollo:
1. Subir `teams-manifest/atenea-teams.zip` al Teams Admin Center
2. Solo para desarrolladores

### Producción:
1. Subir `teams-manifest-production/atenea-teams-production.zip` 
2. Distribuir a toda la organización

## ❗ Troubleshooting

### Deploy fallido:
```bash
# Ver logs del deploy
az webapp log tail --name atenea-bot-prod --resource-group rg-atenea-bot
```

### Tests fallidos:
```bash
# Ejecutar tests localmente
npm test
npm run lint
```

### Secrets incorrectos:
```bash
# Recrear secretos
./scripts/github/setup-github-secrets.sh
```