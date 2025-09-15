import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SalesService } from '../sales/sales.service';
import { OrganizationService } from '../organization/organization.service';
import { IncidentsService } from '../incidents/incidents.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AIMessageService {
  private azureOpenAIEndpoint: string;
  private azureOpenAIKey: string;
  private azureOpenAIDeployment: string;
  private azureOpenAIVersion: string;
  private conversationHistory: Map<string, any[]> = new Map();

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private salesService: SalesService,
    private organizationService: OrganizationService,
    private incidentsService: IncidentsService,
    private aiService: AiService,
  ) {
    // Config desde .env (ver .env / .env.production)
    this.azureOpenAIEndpoint =
      this.configService.get<string>('AZURE_OPENAI_ENDPOINT') ||
      'https://westeurope.api.cognitive.microsoft.com';
    this.azureOpenAIKey =
      this.configService.get<string>('AZURE_OPENAI_API_KEY') || '';
    this.azureOpenAIDeployment =
      this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT_NAME') ||
      'gpt-4o-mini';
    this.azureOpenAIVersion =
      this.configService.get<string>('AZURE_OPENAI_API_VERSION') ||
      '2024-08-01-preview';
  }

  async processMessage(userId: string, message: string): Promise<string> {
    console.log(`[AIMessageService] Processing message from ${userId}: ${message}`);

    const lowerMessage = message.toLowerCase();
    
    try {
      // Atajos comunes
      if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
        return this.getHelpMessage();
      }
      if (lowerMessage.includes('hola') || lowerMessage.includes('hello')) {
        return this.getWelcomeMessage();
      }

      // 1) Pedir a OpenAI (Azure) que planifique el enrutamiento y parámetros
      const plan = await this.planApiCall(userId, message);
      if (plan) {
        const routed = await this.executePlan(plan, message, userId);
        if (routed) return routed;
      }

      // 2) Fallback a conversación general (Azure OpenAI)
      return await this.processWithAzureOpenAI(userId, message);

    } catch (error) {
      console.error('[AIMessageService] Error:', error);
      return 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.';
    }
  }

  // Plan de enrutamiento generado por OpenAI (Azure)
  private async planApiCall(
    userId: string,
    message: string
  ): Promise<{
    module: 'ventas' | 'incidencias' | 'organizacion' | 'general';
    intent: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint?: string;
    params?: Record<string, any>;
    confidence: number;
    reason: string;
  } | null> {
    try {
      const salesBaseUrl =
        this.configService.get<string>('SALES_API_URL') ||
        this.configService.get<string>('VENTAS_API_URL') ||
        'https://api.365equipo.com/ventas';

      const systemPrompt = `Eres el Router de Atenea. Tu tarea es analizar el mensaje del usuario (en español) y devolver un plan JSON ESTRICTO para cuál módulo debe manejarlo y cómo invocar su API.

Módulos disponibles:
- ventas: consulta de ventas, métricas, periodos de tiempo.
- incidencias: crear ticket, listar/consultar incidencias.
- organizacion: políticas, RRHH, procedimientos. Usa SharePoint (no API HTTP directa).
- general: saludos, conversación ligera o cuando no haya acción de API.

Construye SIEMPRE un JSON válido con estas claves:
{
  "module": "ventas|incidencias|organizacion|general",
  "intent": "breve_nombre_de_intencion",
  "method": "GET|POST|PUT|DELETE",
  "endpoint": "URL completa si aplica (para ventas usa ${salesBaseUrl})",
  "params": { "...": "..." },
  "confidence": 0.0-1.0,
  "reason": "1-2 frases explicando la decisión"
}

Reglas específicas:
- Para ventas: si piden periodos tipo hoy/ayer/semana/mes/etc., calcula "fechaInicio" y "fechaFinal" en ISO (Europe/Madrid) y ponlas en params. Usa method GET y endpoint ${salesBaseUrl}.
- Para incidencias: si piden crear, extrae titulo/descripcion/prioridad (baja|media|alta|critica) en params y usa intent="incident.create". Si piden listar/consultar, usa intent="incident.list" o "incident.status" con params relevantes. endpoint puede omitirse (lo maneja servicio interno).
- Para organizacion: usa intent="org.answer" y params { "question": mensaje } (endpoint omitido).
- Si es solo saludo o charla, module=general; method puede ser GET y sin endpoint.
- Devuelve SOLO el JSON sin texto adicional.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Usuario: ${userId}\nMensaje: ${message}` },
      ];

      const url = `${this.azureOpenAIEndpoint.replace(/\/$/, '')}/openai/deployments/${this.azureOpenAIDeployment}/chat/completions?api-version=${this.azureOpenAIVersion}`;

      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            messages,
            temperature: 0,
            max_tokens: 400,
          },
          {
            headers: {
              'api-key': this.azureOpenAIKey,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      const content = response.data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const plan = JSON.parse(jsonMatch[0]);
      console.log('[AIMessageService] Router plan:', plan);
      return plan;
    } catch (err) {
      console.error('[AIMessageService] planApiCall error:', err);
      // Fallback: usar Gemini (AiService) para decidir el módulo si Azure falla
      try {
        const decision = await this.aiService.determineModule(message);
        const module = (decision.module as any) || 'general';
        const salesBaseUrl =
          this.configService.get<string>('SALES_API_URL') ||
          this.configService.get<string>('VENTAS_API_URL') ||
          'https://api.365equipo.com/ventas';
        return {
          module,
          intent:
            module === 'ventas'
              ? 'sales.query'
              : module === 'incidencias'
              ? 'incident.query'
              : module === 'organizacion'
              ? 'org.answer'
              : 'general.chat',
          method: module === 'ventas' ? 'GET' : 'GET',
          endpoint: module === 'ventas' ? salesBaseUrl : undefined,
          params: {},
          confidence: decision.confidence || 0.4,
          reason: 'Fallback router via Gemini (Azure OpenAI no disponible)'
        } as any;
      } catch (fallbackErr) {
        console.error('[AIMessageService] Gemini fallback routing error:', fallbackErr);
        return null;
      }
    }
  }

  // Ejecutar el plan llamando al servicio correspondiente
  private async executePlan(
    plan: {
      module: 'ventas' | 'incidencias' | 'organizacion' | 'general';
      intent: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      endpoint?: string;
      params?: Record<string, any>;
      confidence: number;
      reason: string;
    },
    originalMessage: string,
    userId: string
  ): Promise<string | null> {
    try {
      switch (plan.module) {
        case 'ventas': {
          const fechas = {
            fechaInicio: plan.params?.fechaInicio,
            fechaFinal: plan.params?.fechaFinal,
          };
          const res = await this.salesService.processSalesQuery(originalMessage, fechas);
          return res.message;
        }
        case 'incidencias': {
          // Reutilizamos el servicio existente; el intent puede ayudar en el futuro
          const res = await this.incidentsService.processIncidentQuery(originalMessage, userId);
          return res.message;
        }
        case 'organizacion': {
          const res = await this.organizationService.processOrganizationQuery(originalMessage);
          return res.message;
        }
        case 'general':
        default:
          return null; // Dejar que el fallback conversacional responda
      }
    } catch (err) {
      console.error('[AIMessageService] executePlan error:', err);
      return null;
    }
  }

  private async processWithAzureOpenAI(userId: string, message: string): Promise<string> {
    try {
      const userHistory = this.conversationHistory.get(userId) || [];
      
      const systemPrompt = `Eres Atenea, un asistente empresarial inteligente para Microsoft Teams. 
      Tu función es ayudar con:
      - Consultas de ventas y métricas
      - Gestión de incidencias  
      - Información sobre políticas y documentación
      - Soporte general empresarial
      
      Responde de forma concisa, profesional y útil. Usa emojis cuando sea apropiado.
      Máximo 200 palabras por respuesta.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...userHistory.slice(-6).flatMap(h => [
          { role: 'user', content: h.user },
          { role: 'assistant', content: h.bot }
        ]),
        { role: 'user', content: message }
      ];

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.azureOpenAIEndpoint.replace(/\/$/, '')}/openai/deployments/${this.azureOpenAIDeployment}/chat/completions?api-version=${this.azureOpenAIVersion}`,
          {
            messages,
            max_tokens: 500,
            temperature: 0.7,
            top_p: 0.9
          },
          {
            headers: {
              'api-key': this.azureOpenAIKey,
              'Content-Type': 'application/json'
            }
          }
        )
      );

      const aiResponse = response.data.choices[0].message.content;
      
      userHistory.push({ user: message, bot: aiResponse });
      this.conversationHistory.set(userId, userHistory.slice(-10));
      
      return aiResponse;
    } catch (error) {
      console.error('[AIMessageService] Azure OpenAI Error:', error);
      // Fallback: respuesta general con Gemini si Azure falla
      try {
        const gen = await this.aiService.generateGeneralResponse(message, userId);
        return gen.message;
      } catch (fallbackErr) {
        console.error('[AIMessageService] Gemini general fallback error:', fallbackErr);
        return this.getDefaultResponse(message);
      }
    }
  }

  private getDefaultResponse(message: string): string {
    return `Entiendo que necesitas ayuda con: "${message}"\n\n` +
      `Puedo asistirte con:\n` +
      `📊 Ventas - "ventas de hoy"\n` +
      `🎫 Incidencias - "crear incidencia"\n` +
      `📚 Documentación - "política de vacaciones"\n` +
      `❓ Ayuda - "ayuda"\n\n` +
      `¿En qué puedo ayudarte específicamente?`;
  }

  private getWelcomeMessage(): string {
    return `¡Hola! 👋 Soy **Atenea**, tu asistente empresarial inteligente.\n\n` +
      `Estoy aquí para ayudarte con:\n` +
      `📊 **Ventas** - Métricas y reportes en tiempo real\n` +
      `🎫 **Incidencias** - Crear y gestionar tickets\n` +
      `📚 **Documentación** - Políticas y manuales\n` +
      `💡 **Soporte** - Respuestas a tus preguntas\n\n` +
      `¿En qué puedo ayudarte hoy?`;
  }

  private getHelpMessage(): string {
    return `❓ **Comandos Disponibles**\n\n` +
      `**Ventas:**\n` +
      `• ventas de hoy\n` +
      `• ventas de ayer\n` +
      `• ventas de la semana\n` +
      `• ventas del mes\n\n` +
      `**Incidencias:**\n` +
      `• crear incidencia\n` +
      `• estado incidencias\n` +
      `• incidencia [ID]\n\n` +
      `**Documentación:**\n` +
      `• política de vacaciones\n` +
      `• manual de procedimientos\n` +
      `• contactos RRHH\n\n` +
      `**General:**\n` +
      `• ayuda - Ver este menú\n` +
      `• hola - Mensaje de bienvenida\n\n` +
      `💡 Tip: También puedes hacer preguntas en lenguaje natural`;
  }
}
