# Atenea Bot - Guía Completa de Configuración y Despliegue

## 📋 Descripción
Atenea es un asistente empresarial inteligente para Microsoft Teams, desarrollado con NestJS y Bot Framework. Utiliza Azure OpenAI GPT-4o Mini para generar respuestas inteligentes y maneja consultas de ventas, incidencias y documentación empresarial.

## 🏗️ Arquitectura del Sistema

### Componentes Principales:
- **Backend NestJS**: API y lógica del bot (`atenea-api/`)
- **Azure Bot Service**: Integración con Microsoft Teams
- **Azure OpenAI**: Procesamiento de IA con GPT-4o Mini
- **Bot Framework**: Comunicación con Teams

### Información del Bot Creado:
- **Microsoft App ID**: `7ef1434c-efca-45b3-a285-771be3d57bfa`
- **Resource Group**: `rg-atenea-bot`
- **Bot Name**: `atenea-bot-365`
- **Azure OpenAI**: `atenea-openai`
- **Modelo**: GPT-4o Mini (2024-07-18)

## 📂 Estructura del Proyecto

```
atenea-api/
├── src/
│   ├── bot/
│   │   ├── bot.module.ts          # Módulo del bot
│   │   ├── bot.adapter.ts         # Adaptador Bot Framework
│   │   ├── bot.controller.ts      # Controlador de mensajes
│   │   ├── atenea.bot.ts          # Lógica principal del bot
│   │   └── ai-message.service.ts  # Servicio de IA (Azure OpenAI)
│   ├── app.module.ts              # Módulo principal
│   └── main.ts                    # Punto de entrada
├── teams-manifest/
│   ├── manifest.json              # Configuración de Teams
│   ├── color.png                  # Icono a color (192x192)
│   └── outline.png                # Icono monocromático (32x32)
├── package.json
├── .env                           # Variables de entorno
└── startup.sh                     # Script de inicio para Azure
```

## 🚀 Configuración Inicial

### 1. Prerrequisitos

#### Software Requerido:
```bash
# Node.js 20 LTS
node --version  # v20.x.x

# Azure CLI
brew install azure-cli
az --version

# ngrok (para desarrollo local)
# Descargar desde https://ngrok.com/download
```

#### Cuentas Necesarias:
- Cuenta de Azure con suscripción activa
- Cuenta de Microsoft 365 con acceso a Teams
- Permisos de administrador para instalar apps en Teams

### 2. Autenticación Azure

```bash
# Login a Azure
az login

# Verificar suscripción activa
az account list --output table

# Configurar suscripción por defecto (si tienes varias)
az account set --subscription "TU-SUBSCRIPTION-ID"
```

## 🛠️ Configuración de Azure (Solo Primera Vez)

### 1. Registrar Proveedores

```bash
# Registrar proveedores necesarios
az provider register --namespace Microsoft.BotService --wait
az provider register --namespace Microsoft.Web --wait
az provider register --namespace Microsoft.CognitiveServices --wait
```

### 2. Crear Resource Group

```bash
az group create --name rg-atenea-bot --location westeurope
```

### 3. Crear App Registration

```bash
# Crear aplicación en Azure AD
APP_INFO=$(az ad app create --display-name "atenea-bot-app" --sign-in-audience AzureADandPersonalMicrosoftAccount)
APP_ID=$(echo $APP_INFO | jq -r '.appId')

# Crear secret para la aplicación
SECRET_INFO=$(az ad app credential reset --id $APP_ID --years 2)
APP_SECRET=$(echo $SECRET_INFO | jq -r '.password')

# Guardar estas credenciales
echo "App ID: $APP_ID"
echo "App Secret: $APP_SECRET"
```

### 4. Crear Azure Bot

```bash
az bot create \
  --resource-group rg-atenea-bot \
  --name atenea-bot-365 \
  --appid $APP_ID \
  --sku F0 \
  --endpoint "https://atenea-bot-365.azurewebsites.net/api/messages" \
  --app-type MultiTenant
```

### 5. Habilitar Canal de Teams

```bash
az bot msteams create --name atenea-bot-365 --resource-group rg-atenea-bot
```

### 6. Cambiar Nombre Visible del Bot

```bash
# Cambiar display name para que se vea "Atenea" en Teams
az bot update --name atenea-bot-365 --resource-group rg-atenea-bot --display-name "Atenea"
az ad app update --id $APP_ID --display-name "Atenea"
```

### 7. Crear Azure OpenAI

```bash
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

# Obtener API Key
az cognitiveservices account keys list --name atenea-openai --resource-group rg-atenea-bot
```

### 8. Crear Infraestructura de Hosting (Para Producción)

```bash
# Crear App Service Plan
az appservice plan create \
  --name asp-atenea-bot \
  --resource-group rg-atenea-bot \
  --sku F1 \
  --is-linux

# Crear Web App
az webapp create \
  --name atenea-bot-365 \
  --resource-group rg-atenea-bot \
  --plan asp-atenea-bot \
  --runtime "NODE:20-lts"
```

## 💻 Configuración del Código

### 1. Clonar y Configurar Proyecto

```bash
# Navegar al directorio del proyecto
cd atenea-api

# Instalar dependencias
npm install

# Instalar dependencias adicionales para módulos
npm install @microsoft/microsoft-graph-client isomorphic-fetch pdf-parse chromadb
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en `atenea-api/`:

```env
# Azure Bot Configuration
MICROSOFT_APP_ID=tu-app-id-aqui
MICROSOFT_APP_PASSWORD=tu-secret-aqui
MICROSOFT_APP_TYPE=MultiTenant
MICROSOFT_APP_TENANT_ID=common

# Bot Settings
BOT_DOMAIN=https://atenea-bot-365.azurewebsites.net
PORT=3978

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://westeurope.api.cognitive.microsoft.com
AZURE_OPENAI_KEY=tu-openai-key-aqui
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini

# Módulos APIs - Configurar con tus endpoints
VENTAS_API_BASE_URL=https://tu-api-ventas.com/api
INCIDENCIAS_API_BASE_URL=https://tu-api-incidencias.com/api
ORGANIZACION_API_BASE_URL=https://tu-api-organizacion.com/api

# APIs Keys (si las necesitas)
VENTAS_API_KEY=tu-api-key-ventas
INCIDENCIAS_API_KEY=tu-api-key-incidencias
ORGANIZACION_API_KEY=tu-api-key-organizacion

# SharePoint Configuration (para documentación)
SHAREPOINT_TENANT_ID=tu-tenant-id
SHAREPOINT_CLIENT_ID=tu-client-id-sharepoint
SHAREPOINT_CLIENT_SECRET=tu-client-secret-sharepoint
SHAREPOINT_SITE_URL=https://tuempresa.sharepoint.com/sites/documentacion
SHAREPOINT_FOLDER_PATH=/Documentos%20Atenea

# ChromaDB Configuration (para embeddings de documentos)
CHROMADB_URL=http://localhost:8000
CHROMADB_COLLECTION_NAME=atenea-docs

# Azure Settings (para referencia)
AZURE_SUBSCRIPTION_ID=tu-subscription-id
AZURE_RESOURCE_GROUP=rg-atenea-bot
AZURE_BOT_NAME=atenea-bot-365
```

### 3. Compilar Proyecto

```bash
npm run build
```

## 🔧 Configuración de Módulos Específicos

Atenea está diseñado con una arquitectura modular que permite conectarse a tus APIs existentes y procesar documentación de SharePoint. El bot usa IA para determinar automáticamente qué módulo usar según la consulta del usuario.

### Arquitectura de Módulos:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Usuario       │───▶│   Atenea AI      │───▶│   Clasificador  │
│   (Teams)       │    │   (GPT-4o Mini)  │    │   Inteligente   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        │                               │                               │
                        ▼                               ▼                               ▼
              ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
              │  Módulo Ventas  │           │ Módulo Soporte  │           │ Módulo Docs     │
              │  (API Calls)    │           │ (API Calls)     │           │ (SharePoint)    │
              └─────────────────┘           └─────────────────┘           └─────────────────┘
                        │                               │                               │
                        ▼                               ▼                               ▼
              ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
              │   Tu API de     │           │   Tu API de     │           │   SharePoint    │
              │     Ventas      │           │   Incidencias   │           │   + ChromaDB    │
              └─────────────────┘           └─────────────────┘           └─────────────────┘
```

### 1. Módulo de Ventas

#### 1.1 Configuración del Servicio

Crear `src/modules/ventas/ventas.service.ts`:

```typescript
import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface VentasQuery {
  periodo: 'hoy' | 'ayer' | 'semana' | 'mes' | 'custom';
  tienda?: string;
  fechaInicio?: string;
  fechaFin?: string;
  producto?: string;
}

@Injectable()
export class VentasService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('VENTAS_API_BASE_URL');
    this.apiKey = this.configService.get('VENTAS_API_KEY');
  }

  async consultarVentas(query: string): Promise<any> {
    try {
      // Parsear consulta con IA
      const ventasQuery = await this.parseVentasQuery(query);
      
      // Construir endpoint según el tipo de consulta
      const endpoint = this.buildVentasEndpoint(ventasQuery);
      
      // Hacer petición HTTP
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}${endpoint}`, ventasQuery, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        })
      );

      return this.formatVentasResponse(response.data, ventasQuery);
    } catch (error) {
      throw new HttpException(`Error consultando ventas: ${error.message}`, 500);
    }
  }

  private async parseVentasQuery(query: string): Promise<VentasQuery> {
    const queryLower = query.toLowerCase();
    
    // Detectar período
    let periodo: VentasQuery['periodo'] = 'hoy';
    if (queryLower.includes('ayer')) periodo = 'ayer';
    else if (queryLower.includes('semana')) periodo = 'semana';
    else if (queryLower.includes('mes')) periodo = 'mes';
    
    // Detectar tienda
    const tiendaMatch = queryLower.match(/tienda\s+(\w+)/);
    const tienda = tiendaMatch ? tiendaMatch[1] : undefined;
    
    // Detectar producto
    const productoMatch = queryLower.match(/producto\s+(.+?)(?:\s|$)/);
    const producto = productoMatch ? productoMatch[1] : undefined;

    return { periodo, tienda, producto };
  }

  private buildVentasEndpoint(query: VentasQuery): string {
    switch (query.periodo) {
      case 'hoy':
        return '/ventas/diarias';
      case 'ayer':
        return '/ventas/diarias';
      case 'semana':
        return '/ventas/semanales';
      case 'mes':
        return '/ventas/mensuales';
      default:
        return '/ventas/consultar';
    }
  }

  private formatVentasResponse(data: any, query: VentasQuery): string {
    if (!data || !data.success) {
      return 'No se pudieron obtener los datos de ventas en este momento.';
    }

    const { ventas, resumen } = data;
    
    let response = `📊 **Ventas ${query.periodo}**\n\n`;
    
    if (resumen) {
      response += `💰 **Total**: €${resumen.total?.toLocaleString('es-ES') || 0}\n`;
      response += `📦 **Productos**: ${resumen.productos || 0}\n`;
      response += `👥 **Clientes**: ${resumen.clientes || 0}\n`;
      
      if (resumen.comparacion) {
        const cambio = resumen.comparacion > 0 ? '📈' : '📉';
        response += `${cambio} **Vs período anterior**: ${resumen.comparacion > 0 ? '+' : ''}${resumen.comparacion}%\n`;
      }
    }

    if (ventas && ventas.length > 0) {
      response += '\n**Detalle por tienda:**\n';
      ventas.slice(0, 5).forEach((venta: any) => {
        response += `• ${venta.tienda}: €${venta.total?.toLocaleString('es-ES')}\n`;
      });
    }

    return response;
  }
}
```

#### 1.2 Ejemplos de Endpoints que Debe Llamar

```typescript
// Tu API debe tener estos endpoints:
// GET /api/ventas/diarias?fecha=2025-08-08&tienda=madrid
// GET /api/ventas/semanales?semana=32&año=2025
// GET /api/ventas/mensuales?mes=8&año=2025
// POST /api/ventas/consultar { "filtros": {...} }

// Respuesta esperada:
{
  "success": true,
  "ventas": [
    {
      "tienda": "Madrid Centro",
      "total": 15420.50,
      "productos": 87,
      "clientes": 34,
      "fecha": "2025-08-08"
    }
  ],
  "resumen": {
    "total": 15420.50,
    "productos": 87,
    "clientes": 34,
    "comparacion": 12.3
  }
}
```

### 2. Módulo de Incidencias/Soporte

#### 2.1 Configuración del Servicio

Crear `src/modules/incidencias/incidencias.service.ts`:

```typescript
import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface IncidenciaData {
  titulo: string;
  descripcion: string;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  categoria: string;
  usuario: string;
}

@Injectable()
export class IncidenciasService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('INCIDENCIAS_API_BASE_URL');
    this.apiKey = this.configService.get('INCIDENCIAS_API_KEY');
  }

  async procesarIncidencia(query: string, userId: string): Promise<any> {
    try {
      if (this.isCrearIncidencia(query)) {
        return await this.crearIncidencia(query, userId);
      } else if (this.isConsultarIncidencia(query)) {
        return await this.consultarIncidencias(query, userId);
      } else {
        return await this.ayudaIncidencias();
      }
    } catch (error) {
      throw new HttpException(`Error procesando incidencia: ${error.message}`, 500);
    }
  }

  private async crearIncidencia(query: string, userId: string): Promise<string> {
    const incidenciaData = await this.parseIncidenciaData(query, userId);
    
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/incidencias`, incidenciaData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
    );

    if (response.data.success) {
      const { id, titulo, prioridad } = response.data.incidencia;
      return `✅ **Incidencia creada exitosamente**\n\n` +
             `🎫 **ID**: ${id}\n` +
             `📋 **Título**: ${titulo}\n` +
             `⚡ **Prioridad**: ${prioridad.toUpperCase()}\n` +
             `👤 **Asignada a**: Equipo de soporte\n\n` +
             `Te notificaremos por Teams cuando haya actualizaciones.`;
    } else {
      return 'No se pudo crear la incidencia. Por favor, intenta de nuevo.';
    }
  }

  private async consultarIncidencias(query: string, userId: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/incidencias/usuario/${userId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      })
    );

    const incidencias = response.data.incidencias || [];
    
    if (incidencias.length === 0) {
      return 'No tienes incidencias activas en este momento. 😊';
    }

    let result = `🎫 **Tus Incidencias Activas** (${incidencias.length})\n\n`;
    
    incidencias.slice(0, 5).forEach((inc: any) => {
      const estado = this.getEstadoEmoji(inc.estado);
      const prioridad = this.getPrioridadEmoji(inc.prioridad);
      
      result += `${estado} **${inc.id}** - ${inc.titulo}\n`;
      result += `   ${prioridad} ${inc.prioridad} • ${inc.fechaCreacion}\n\n`;
    });

    return result;
  }

  private async parseIncidenciaData(query: string, userId: string): Promise<IncidenciaData> {
    const queryLower = query.toLowerCase();
    
    // Extraer título y descripción
    let titulo = 'Nueva incidencia';
    let descripcion = query;
    
    if (queryLower.includes(':')) {
      const parts = query.split(':');
      titulo = parts[0].replace(/crear incidencia/i, '').trim();
      descripcion = parts.slice(1).join(':').trim();
    }
    
    // Detectar prioridad
    let prioridad: IncidenciaData['prioridad'] = 'media';
    if (queryLower.includes('urgente') || queryLower.includes('crítica')) prioridad = 'critica';
    else if (queryLower.includes('alta')) prioridad = 'alta';
    else if (queryLower.includes('baja')) prioridad = 'baja';
    
    // Detectar categoría
    let categoria = 'general';
    if (queryLower.includes('sistema')) categoria = 'sistema';
    else if (queryLower.includes('red')) categoria = 'red';
    else if (queryLower.includes('software')) categoria = 'software';
    
    return { titulo, descripcion, prioridad, categoria, usuario: userId };
  }

  private isCrearIncidencia(query: string): boolean {
    return query.toLowerCase().includes('crear') || 
           query.toLowerCase().includes('nueva') ||
           query.toLowerCase().includes('reportar');
  }

  private isConsultarIncidencia(query: string): boolean {
    return query.toLowerCase().includes('mis incidencias') ||
           query.toLowerCase().includes('estado') ||
           query.toLowerCase().includes('consultar');
  }

  private getEstadoEmoji(estado: string): string {
    const emojis: Record<string, string> = {
      'abierta': '🟡',
      'en_progreso': '🔵', 
      'resuelto': '🟢',
      'cerrado': '⚫'
    };
    return emojis[estado] || '⚪';
  }

  private getPrioridadEmoji(prioridad: string): string {
    const emojis: Record<string, string> = {
      'baja': '🟢',
      'media': '🟡',
      'alta': '🟠',
      'critica': '🔴'
    };
    return emojis[prioridad] || '⚪';
  }

  private async ayudaIncidencias(): Promise<string> {
    return `🎫 **Sistema de Incidencias**\n\n` +
           `Para **crear** una incidencia:\n` +
           `• "Crear incidencia: El sistema está lento"\n` +
           `• "Nueva incidencia crítica: Error en ventas"\n` +
           `• "Reportar problema: No puedo acceder"\n\n` +
           `Para **consultar** incidencias:\n` +
           `• "Mis incidencias"\n` +
           `• "Estado de incidencias"\n` +
           `• "Ver tickets abiertos"\n\n` +
           `**Prioridades**: Baja, Media, Alta, Crítica\n` +
           `**Categorías**: General, Sistema, Red, Software`;
  }
}
```

#### 2.2 Ejemplos de Endpoints para Incidencias

```typescript
// Tu API debe tener estos endpoints:
// POST /api/incidencias - Crear nueva incidencia
// GET /api/incidencias/usuario/:userId - Ver incidencias del usuario
// PUT /api/incidencias/:id - Actualizar incidencia
// GET /api/incidencias/:id - Ver detalle de incidencia

// Payload para crear:
{
  "titulo": "Problema con sistema",
  "descripcion": "Descripción detallada",
  "prioridad": "alta",
  "categoria": "sistema",
  "usuario": "user-id"
}

// Respuesta esperada:
{
  "success": true,
  "incidencia": {
    "id": "INC-2025-001",
    "titulo": "Problema con sistema", 
    "estado": "abierta",
    "prioridad": "alta",
    "fechaCreacion": "2025-08-08T10:30:00Z"
  }
}
```

### 3. Módulo de Documentación (SharePoint + ChromaDB)

#### 3.1 Configuración de SharePoint

Crear `src/modules/documentacion/sharepoint.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
const pdf = require('pdf-parse');

@Injectable()
export class SharePointService {
  private graphClient: Client;
  private siteUrl: string;
  private folderPath: string;

  constructor(private configService: ConfigService) {
    this.siteUrl = this.configService.get('SHAREPOINT_SITE_URL');
    this.folderPath = this.configService.get('SHAREPOINT_FOLDER_PATH');
    
    this.graphClient = Client.init({
      authProvider: this.getAuthProvider()
    });
  }

  private getAuthProvider() {
    const clientId = this.configService.get('SHAREPOINT_CLIENT_ID');
    const clientSecret = this.configService.get('SHAREPOINT_CLIENT_SECRET');
    const tenantId = this.configService.get('SHAREPOINT_TENANT_ID');

    return async (done: any) => {
      try {
        // Implementar OAuth2 client credentials flow
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&scope=https://graph.microsoft.com/.default`
        });
        
        const tokenData = await tokenResponse.json();
        done(null, tokenData.access_token);
      } catch (error) {
        done(error, null);
      }
    };
  }

  async syncDocuments(): Promise<void> {
    try {
      console.log('🔄 Sincronizando documentos de SharePoint...');
      
      // Obtener archivos de la carpeta específica
      const files = await this.graphClient
        .api(`/sites/${this.siteUrl}/drive/root:${this.folderPath}:/children`)
        .filter("file ne null and (endswith(name,'.pdf') or endswith(name,'.docx'))")
        .get();

      console.log(`📄 Encontrados ${files.value.length} documentos`);

      for (const file of files.value) {
        await this.processDocument(file);
      }
      
      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('❌ Error sincronizando documentos:', error);
      throw error;
    }
  }

  private async processDocument(file: any): Promise<void> {
    try {
      console.log(`📖 Procesando: ${file.name}`);
      
      // Descargar archivo
      const fileContent = await this.graphClient
        .api(`/sites/${this.siteUrl}/drive/items/${file.id}/content`)
        .get();

      let textContent: string;
      
      if (file.name.toLowerCase().endsWith('.pdf')) {
        textContent = await this.extractPdfText(fileContent);
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        textContent = await this.extractDocxText(fileContent);
      } else {
        return;
      }

      // Guardar en ChromaDB
      await this.saveToChromaDB({
        filename: file.name,
        content: textContent,
        lastModified: file.lastModifiedDateTime,
        size: file.size
      });

    } catch (error) {
      console.error(`Error procesando ${file.name}:`, error);
    }
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('Error extrayendo texto del PDF:', error);
      return '';
    }
  }

  private async extractDocxText(buffer: Buffer): Promise<string> {
    // Implementar extracción de DOCX (puedes usar librería como 'mammoth')
    // Por simplicidad, retorno placeholder
    return 'Contenido del documento Word (implementar extracción)';
  }

  private async saveToChromaDB(document: any): Promise<void> {
    const chromaService = new ChromaDBService(this.configService);
    await chromaService.addDocument(document);
  }
}
```

#### 3.2 Configuración de ChromaDB

Crear `src/modules/documentacion/chromadb.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaApi, OpenAIEmbeddingFunction } from 'chromadb';

@Injectable()
export class ChromaDBService {
  private client: ChromaApi;
  private collection: any;
  private embeddingFunction: any;

  constructor(private configService: ConfigService) {
    this.client = new ChromaApi({
      basePath: this.configService.get('CHROMADB_URL')
    });
    
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: this.configService.get('AZURE_OPENAI_KEY'),
      openai_api_base: this.configService.get('AZURE_OPENAI_ENDPOINT'),
      openai_model: "text-embedding-ada-002"
    });
  }

  async initialize(): Promise<void> {
    try {
      const collectionName = this.configService.get('CHROMADB_COLLECTION_NAME');
      
      this.collection = await this.client.getOrCreateCollection({
        name: collectionName,
        embeddingFunction: this.embeddingFunction
      });
      
      console.log(`✅ ChromaDB collection '${collectionName}' inicializada`);
    } catch (error) {
      console.error('❌ Error inicializando ChromaDB:', error);
      throw error;
    }
  }

  async addDocument(document: any): Promise<void> {
    try {
      // Dividir documento en chunks para mejor búsqueda
      const chunks = this.chunkText(document.content, 1000);
      
      for (let i = 0; i < chunks.length; i++) {
        await this.collection.add({
          ids: [`${document.filename}_chunk_${i}`],
          documents: [chunks[i]],
          metadatas: [{
            filename: document.filename,
            chunk_index: i,
            last_modified: document.lastModified,
            size: document.size
          }]
        });
      }
      
      console.log(`📚 Documento ${document.filename} agregado a ChromaDB`);
    } catch (error) {
      console.error(`Error agregando documento ${document.filename}:`, error);
      throw error;
    }
  }

  async searchDocuments(query: string, limit: number = 5): Promise<any[]> {
    try {
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit
      });
      
      return results.documents[0].map((doc: string, index: number) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        distance: results.distances[0][index]
      }));
    } catch (error) {
      console.error('Error buscando documentos:', error);
      return [];
    }
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const sentences = text.split(/[.!?]+/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      currentChunk += sentence + '. ';
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}
```

#### 3.3 Servicio de Documentación

Crear `src/modules/documentacion/documentacion.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { SharePointService } from './sharepoint.service';
import { ChromaDBService } from './chromadb.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DocumentacionService {
  constructor(
    private sharePointService: SharePointService,
    private chromaService: ChromaDBService,
    private configService: ConfigService,
    private httpService: HttpService
  ) {}

  async inicializar(): Promise<void> {
    await this.chromaService.initialize();
    // La sincronización se puede hacer en background
    // setInterval(() => this.syncDocuments(), 3600000); // Cada hora
  }

  async consultarDocumentacion(query: string): Promise<string> {
    try {
      // Buscar documentos relevantes
      const documentos = await this.chromaService.searchDocuments(query, 3);
      
      if (documentos.length === 0) {
        return `📚 No encontré documentación específica sobre "${query}".\n\n` +
               `Puedes consultar:\n` +
               `• Políticas de empresa\n` +
               `• Procedimientos operativos\n` +
               `• Manuales de usuario\n\n` +
               `¿Hay algo específico que necesites saber?`;
      }

      // Generar respuesta con IA usando el contexto de documentos
      const contexto = documentos.map(doc => doc.content).join('\n\n');
      const respuesta = await this.generarRespuestaIA(query, contexto);
      
      // Agregar fuentes
      const fuentes = documentos.map(doc => 
        `📄 ${doc.metadata.filename}`
      ).join('\n');
      
      return `${respuesta}\n\n**Fuentes consultadas:**\n${fuentes}`;
      
    } catch (error) {
      console.error('Error consultando documentación:', error);
      return 'No pude acceder a la documentación en este momento. Intenta de nuevo más tarde.';
    }
  }

  async syncDocuments(): Promise<void> {
    try {
      await this.sharePointService.syncDocuments();
    } catch (error) {
      console.error('Error sincronizando documentos:', error);
    }
  }

  private async generarRespuestaIA(query: string, contexto: string): Promise<string> {
    const prompt = `Basándote en la siguiente documentación empresarial, responde a la consulta del usuario de forma clara y concisa.

Documentación:
${contexto}

Consulta del usuario: ${query}

Instrucciones:
- Responde de forma profesional y útil
- Si la información no está en los documentos, dilo claramente
- Usa emojis apropiados para hacer la respuesta más amigable
- Máximo 300 palabras

Respuesta:`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get('AZURE_OPENAI_ENDPOINT')}/openai/deployments/${this.configService.get('AZURE_OPENAI_DEPLOYMENT')}/chat/completions?api-version=2024-08-01-preview`,
          {
            messages: [
              { role: 'system', content: 'Eres un asistente de documentación empresarial.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.3
          },
          {
            headers: {
              'api-key': this.configService.get('AZURE_OPENAI_KEY'),
              'Content-Type': 'application/json'
            }
          }
        )
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generando respuesta IA:', error);
      return 'No pude procesar la documentación en este momento.';
    }
  }
}
```

### 4. Configuración del ChromaDB (Opcional - Base de Datos Vectorial)

#### 4.1 Instalación con Docker

```bash
# Crear docker-compose.yml para ChromaDB
cat > docker-compose.chromadb.yml << 'EOF'
version: '3.8'
services:
  chromadb:
    image: ghcr.io/chroma-core/chroma:latest
    ports:
      - "8000:8000"
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_PORT=8000
    volumes:
      - chromadb_data:/chroma/chroma
    restart: unless-stopped

volumes:
  chromadb_data:
EOF

# Arrancar ChromaDB
docker-compose -f docker-compose.chromadb.yml up -d
```

#### 4.2 Alternativa: ChromaDB en la Nube

Si prefieres usar ChromaDB como servicio, actualiza la variable de entorno:
```env
CHROMADB_URL=https://tu-chroma-instance.com
CHROMADB_API_KEY=tu-api-key
```

### 5. Integración en el AI Message Service

#### 5.1 Actualizar ai-message.service.ts

```typescript
// Agregar al constructor:
constructor(
  private configService: ConfigService,
  private httpService: HttpService,
  private ventasService: VentasService,           // Nuevo
  private incidenciasService: IncidenciasService, // Nuevo
  private documentacionService: DocumentacionService // Nuevo
) {
  // ... configuración existente
}

// Actualizar processMessage:
async processMessage(userId: string, message: string): Promise<string> {
  console.log(`[AIMessageService] Processing message from ${userId}: ${message}`);

  const lowerMessage = message.toLowerCase();
  
  try {
    // Clasificar mensaje inteligentemente
    const modulo = await this.clasificarMensaje(message);
    
    switch (modulo) {
      case 'ventas':
        return await this.ventasService.consultarVentas(message);
      
      case 'incidencias':
        return await this.incidenciasService.procesarIncidencia(message, userId);
      
      case 'documentacion':
        return await this.documentacionService.consultarDocumentacion(message);
      
      case 'saludo':
        return this.getWelcomeMessage();
      
      case 'ayuda':
        return this.getHelpMessage();
      
      default:
        // Usar Azure OpenAI para respuestas generales
        return await this.processWithAzureOpenAI(userId, message);
    }
  } catch (error) {
    console.error('[AIMessageService] Error:', error);
    return 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.';
  }
}

private async clasificarMensaje(message: string): Promise<string> {
  const prompt = `Clasifica este mensaje del usuario en una de estas categorías:

Categorías disponibles:
- "ventas": Consultas sobre ventas, facturación, productos vendidos, ingresos, tiendas, métricas comerciales
- "incidencias": Crear, consultar o gestionar incidencias, problemas técnicos, soporte, tickets
- "documentacion": Consultas sobre políticas, procedimientos, manuales, normativas, información empresarial
- "saludo": Saludos, presentaciones, "hola", "buenos días"
- "ayuda": Solicitud de ayuda, comandos, "qué puedes hacer"
- "general": Cualquier otra consulta

Mensaje del usuario: "${message}"

Responde SOLO con la categoría correspondiente:`;

  try {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.azureOpenAIEndpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview`,
        {
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
          temperature: 0.1
        },
        {
          headers: {
            'api-key': this.azureOpenAIKey,
            'Content-Type': 'application/json'
          }
        }
      )
    );

    const categoria = response.data.choices[0].message.content.trim().toLowerCase();
    console.log(`[AIMessageService] Mensaje clasificado como: ${categoria}`);
    
    return categoria;
  } catch (error) {
    console.error('[AIMessageService] Error clasificando mensaje:', error);
    return 'general';
  }
}
```

### 6. Configuración de Permisos en SharePoint

#### 6.1 Registrar Aplicación en Azure AD

```bash
# Crear App Registration para SharePoint
az ad app create --display-name "atenea-sharepoint-reader" --sign-in-audience AzureADMultipleOrgs

# Configurar permisos API de Microsoft Graph:
# - Sites.Read.All
# - Files.Read.All
```

#### 6.2 Configurar Permisos en SharePoint

En SharePoint Admin Center:
1. **Sites** → **Active sites** → Seleccionar tu sitio
2. **Permissions** → **App permissions** 
3. Agregar permisos para la aplicación creada

### 7. Testing de Módulos

#### 7.1 Comandos de Prueba por Módulo

```bash
# Probar en Teams enviando estos mensajes:

# Módulo Ventas:
"ventas de hoy"
"ventas de la semana pasada tienda madrid"
"cuántos productos se vendieron ayer"
"comparar ventas con el mes pasado"

# Módulo Incidencias:
"crear incidencia: el sistema está lento"
"nueva incidencia crítica: error en el punto de venta"
"mis incidencias abiertas"
"estado de ticket INC-001"

# Módulo Documentación:
"política de vacaciones"
"cómo solicitar permisos"
"procedimiento para cambios de turno"
"manual de seguridad"
```

#### 7.2 Logs para Debugging

En tu consola de desarrollo verás:
```bash
[AIMessageService] Processing message from user-123: ventas de hoy
[AIMessageService] Mensaje clasificado como: ventas
[VentasService] Consultando ventas para período: hoy
[VentasService] Calling endpoint: /ventas/diarias
```

## 🖥️ Desarrollo Local con ngrok

### 1. Instalar ngrok

Descargar desde https://ngrok.com/download o usar Homebrew:
```bash
brew install ngrok
```

### 2. Arrancar Bot Localmente

```bash
cd atenea-api

# Arrancar en modo desarrollo
PORT=3978 MICROSOFT_APP_ID=tu-app-id MICROSOFT_APP_PASSWORD='tu-secret' npm run start:dev
```

### 3. Exponer con ngrok

En otra terminal:
```bash
ngrok http 3978
```

Ngrok te dará una URL como: `https://abc123.ngrok-free.app`

### 4. Actualizar Endpoint en Azure

```bash
az bot update \
  --resource-group rg-atenea-bot \
  --name atenea-bot-365 \
  --endpoint "https://TU-URL-NGROK.ngrok-free.app/api/messages"
```

### 5. Probar en Teams

- Busca "atenea-bot-365" en Teams o instala el bot usando el manifest
- Envía mensajes como "Hola", "ventas de hoy", "ayuda"

## 🚀 Despliegue en Producción

### 1. Configurar Variables de Entorno en Azure

```bash
az webapp config appsettings set \
  --name atenea-bot-365 \
  --resource-group rg-atenea-bot \
  --settings \
    MICROSOFT_APP_ID="tu-app-id" \
    MICROSOFT_APP_PASSWORD="tu-secret" \
    PORT=8080 \
    NODE_ENV=production \
    AZURE_OPENAI_ENDPOINT="https://westeurope.api.cognitive.microsoft.com" \
    AZURE_OPENAI_KEY="tu-openai-key" \
    AZURE_OPENAI_DEPLOYMENT="gpt-4o-mini"
```

### 2. Configurar Comando de Inicio

```bash
az webapp config set \
  --name atenea-bot-365 \
  --resource-group rg-atenea-bot \
  --startup-file "node dist/main.js"
```

### 3. Desplegar Código

#### Opción A: Despliegue ZIP

```bash
# Compilar proyecto
npm run build

# Crear paquete sin dependencias de desarrollo
zip -r deploy.zip . -x "*.git*" "test/*" "*.md" "src/*" ".env"

# Desplegar
az webapp deployment source config-zip \
  --resource-group rg-atenea-bot \
  --name atenea-bot-365 \
  --src deploy.zip
```

#### Opción B: GitHub Actions

Crear `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install and build
      run: |
        cd atenea-api
        npm ci
        npm run build
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: atenea-bot-365
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./atenea-api
```

### 4. Restaurar Endpoint de Producción

```bash
az bot update \
  --resource-group rg-atenea-bot \
  --name atenea-bot-365 \
  --endpoint "https://atenea-bot-365.azurewebsites.net/api/messages"
```

### 5. Verificar Despliegue

```bash
# Ver logs en tiempo real
az webapp log tail --name atenea-bot-365 --resource-group rg-atenea-bot

# Verificar estado
az webapp show --name atenea-bot-365 --resource-group rg-atenea-bot --query state
```

## 📱 Instalación en Microsoft Teams

### 1. Crear Iconos

Necesitas dos iconos PNG:
- **color.png**: 192x192px (icono a color)
- **outline.png**: 32x32px (icono monocromático)

### 2. Configurar Manifest

Archivo `teams-manifest/manifest.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "version": "1.0.0",
  "id": "tu-microsoft-app-id",
  "packageName": "com.empresa365.atenea",
  "developer": {
    "name": "Tu Empresa",
    "websiteUrl": "https://tuempresa.com",
    "privacyUrl": "https://tuempresa.com/privacy",
    "termsOfUseUrl": "https://tuempresa.com/terms"
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "name": {
    "short": "Atenea",
    "full": "Atenea - Asistente Empresarial IA"
  },
  "description": {
    "short": "Tu asistente IA para ventas, incidencias y documentación",
    "full": "Atenea es un asistente inteligente que te ayuda con consultas de ventas en tiempo real, gestión de incidencias y acceso a documentación empresarial."
  },
  "accentColor": "#4facfe",
  "bots": [
    {
      "botId": "tu-microsoft-app-id",
      "scopes": ["personal", "team", "groupchat"],
      "supportsFiles": false,
      "isNotificationOnly": false,
      "commandLists": [
        {
          "scopes": ["personal", "team", "groupchat"],
          "commands": [
            {
              "title": "ventas",
              "description": "Consultar métricas de ventas"
            },
            {
              "title": "incidencia",
              "description": "Gestionar incidencias"
            },
            {
              "title": "ayuda",
              "description": "Ver comandos disponibles"
            }
          ]
        }
      ]
    }
  ],
  "permissions": ["identity", "messageTeamMembers"],
  "validDomains": ["atenea-bot-365.azurewebsites.net"]
}
```

### 3. Crear Package de Teams

```bash
cd teams-manifest
zip -r atenea-teams.zip manifest.json color.png outline.png
```

### 4. Instalar en Teams

1. Abrir Microsoft Teams
2. **Apps** → **Manage your apps** → **Upload a custom app**
3. Seleccionar `atenea-teams.zip`
4. Click **"Add"** para instalarlo

## 🎯 Comandos del Bot

### Comandos Específicos:
- `ventas de hoy` - Métricas de ventas actuales
- `ventas de ayer` - Métricas del día anterior
- `ventas de la semana` - Resumen semanal
- `crear incidencia` - Formulario para nueva incidencia
- `estado incidencias` - Ver incidencias activas
- `ayuda` - Ver todos los comandos disponibles

### Comandos Generales:
- `hola` - Mensaje de bienvenida
- Cualquier pregunta natural - Respuesta con IA

## 🔧 Troubleshooting

### Bot No Responde

1. **Verificar proceso local:**
```bash
ps aux | grep "nest start"
```

2. **Verificar logs en Azure:**
```bash
az webapp log tail --name atenea-bot-365 --resource-group rg-atenea-bot
```

3. **Verificar endpoint:**
```bash
az bot show --name atenea-bot-365 --resource-group rg-atenea-bot --query properties.endpoint
```

### Error de Autenticación

- Verificar `MICROSOFT_APP_ID` y `MICROSOFT_APP_PASSWORD`
- Confirmar que el `botId` en manifest.json coincida con App ID
- Revisar permisos en Azure AD

### Error de Azure OpenAI

- Verificar `AZURE_OPENAI_KEY` y `AZURE_OPENAI_ENDPOINT`
- Confirmar que el deployment esté activo:
```bash
az cognitiveservices account deployment list --name atenea-openai --resource-group rg-atenea-bot
```

### Teams No Encuentra el Bot

- Verificar que el canal de Teams esté habilitado
- Confirmar que `validDomains` incluya el dominio correcto
- Esperar 5-10 minutos después del despliegue

## 🔐 Seguridad y Mantenimiento

### Rotar Secrets

```bash
# Regenerar App Secret
az ad app credential reset --id tu-app-id --years 2

# Actualizar en Azure Web App
az webapp config appsettings set \
  --name atenea-bot-365 \
  --resource-group rg-atenea-bot \
  --settings MICROSOFT_APP_PASSWORD="nuevo-secret"
```

### Monitoreo

```bash
# Configurar Application Insights
az monitor app-insights component create \
  --app atenea-bot-insights \
  --location westeurope \
  --resource-group rg-atenea-bot

# Obtener Instrumentation Key y configurar en Web App
```

### Backup de Configuración

```bash
# Exportar configuración del bot
az bot show --name atenea-bot-365 --resource-group rg-atenea-bot > bot-config-backup.json

# Exportar configuración de Web App
az webapp config show --name atenea-bot-365 --resource-group rg-atenea-bot > webapp-config-backup.json
```

## 📊 Métricas y Costos

### Tier Gratuito Incluye:
- **Azure Bot Service**: 10,000 mensajes/mes (F0)
- **Azure OpenAI**: $10 crédito inicial
- **App Service**: 60 minutos CPU/día (F1)

### Monitorear Uso:
```bash
# Ver métricas del bot
az monitor metrics list --resource /subscriptions/tu-sub/resourceGroups/rg-atenea-bot/providers/Microsoft.BotService/botServices/atenea-bot-365

# Ver uso de OpenAI en Azure Portal
```

## 🗑️ Limpieza de Recursos

Para eliminar todos los recursos:

```bash
# Eliminar resource group (elimina todos los recursos)
az group delete --name rg-atenea-bot --yes --no-wait

# Eliminar App Registration
az ad app delete --id tu-app-id
```

## 📚 Scripts Útiles

### Script de Desarrollo Local

Crear `start-local.sh`:

```bash
#!/bin/bash
echo "🚀 Iniciando Atenea Bot localmente..."

# Verificar variables de entorno
if [ -z "$MICROSOFT_APP_ID" ] || [ -z "$MICROSOFT_APP_PASSWORD" ]; then
    echo "❌ Error: Configura MICROSOFT_APP_ID y MICROSOFT_APP_PASSWORD"
    exit 1
fi

# Arrancar bot
PORT=3978 npm run start:dev
```

### Script de Despliegue

Crear `deploy.sh`:

```bash
#!/bin/bash
echo "📦 Desplegando Atenea Bot a Azure..."

# Compilar
npm run build

# Crear paquete
zip -r deploy.zip . -x "*.git*" "test/*" "*.md" "src/*" ".env" "node_modules/*"

# Desplegar
az webapp deployment source config-zip \
  --resource-group rg-atenea-bot \
  --name atenea-bot-365 \
  --src deploy.zip

echo "✅ Despliegue completado"
```

---

## 📞 Soporte

Para problemas o mejoras:
1. Revisar logs en Azure Portal
2. Verificar configuración de variables de entorno  
3. Confirmar que todos los servicios estén corriendo
4. Revisar la documentación de Bot Framework: https://docs.microsoft.com/azure/bot-service/

---

*Última actualización: Agosto 2025*