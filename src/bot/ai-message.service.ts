import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AIMessageService {
  private azureOpenAIEndpoint: string;
  private azureOpenAIKey: string;
  private conversationHistory: Map<string, any[]> = new Map();

  constructor(
    private configService: ConfigService,
    private httpService: HttpService
  ) {
    this.azureOpenAIEndpoint = 'https://westeurope.api.cognitive.microsoft.com';
    this.azureOpenAIKey = '482874af7ec6474488a9f4b82386d191';
  }

  async processMessage(userId: string, message: string): Promise<string> {
    console.log(`[AIMessageService] Processing message from ${userId}: ${message}`);

    const lowerMessage = message.toLowerCase();
    
    try {
      if (lowerMessage.includes('ventas')) {
        return await this.handleSalesQuery(message);
      }
      
      if (lowerMessage.includes('incidencia')) {
        return await this.handleIncidentQuery(message);
      }
      
      if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
        return this.getHelpMessage();
      }

      if (lowerMessage.includes('hola') || lowerMessage.includes('hello')) {
        return this.getWelcomeMessage();
      }

      // Usar Azure OpenAI para cualquier mensaje no específico
      return await this.processWithAzureOpenAI(userId, message);

    } catch (error) {
      console.error('[AIMessageService] Error:', error);
      return 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.';
    }
  }

  private async handleSalesQuery(message: string): Promise<string> {
    const today = new Date().toLocaleDateString('es-ES');
    
    if (message.toLowerCase().includes('hoy')) {
      return `📊 **Ventas de Hoy (${today})**\n\n` +
        `💰 Total: €15,420.50\n` +
        `📦 Productos vendidos: 87\n` +
        `👥 Clientes atendidos: 34\n` +
        `📈 Variación vs ayer: +12.3%\n\n` +
        `Top productos:\n` +
        `1. Producto A - 23 unidades\n` +
        `2. Producto B - 19 unidades\n` +
        `3. Producto C - 15 unidades`;
    }
    
    if (message.toLowerCase().includes('ayer')) {
      return `📊 **Ventas de Ayer**\n\n` +
        `💰 Total: €13,745.20\n` +
        `📦 Productos vendidos: 76\n` +
        `👥 Clientes atendidos: 29`;
    }
    
    if (message.toLowerCase().includes('semana')) {
      return `📊 **Ventas de la Semana**\n\n` +
        `💰 Total: €87,234.80\n` +
        `📦 Productos vendidos: 512\n` +
        `👥 Clientes atendidos: 198\n` +
        `📈 Mejor día: Martes (€18,420.30)`;
    }

    return `📊 Para consultar ventas, especifica el período:\n` +
      `• "ventas de hoy"\n` +
      `• "ventas de ayer"\n` +
      `• "ventas de la semana"\n` +
      `• "ventas del mes"`;
  }

  private async handleIncidentQuery(message: string): Promise<string> {
    if (message.toLowerCase().includes('crear') || message.toLowerCase().includes('nueva')) {
      return `🎫 **Crear Nueva Incidencia**\n\n` +
        `Para crear una incidencia, proporciona:\n` +
        `1. Descripción del problema\n` +
        `2. Prioridad (Alta/Media/Baja)\n` +
        `3. Área afectada\n\n` +
        `Ejemplo: "Crear incidencia: El sistema de cobro no funciona, prioridad alta, área ventas"\n\n` +
        `¿Cuál es el problema que deseas reportar?`;
    }
    
    if (message.toLowerCase().includes('estado') || message.toLowerCase().includes('consultar')) {
      return `🎫 **Incidencias Activas**\n\n` +
        `📍 INC-001: Sistema de cobro lento\n` +
        `   Estado: En progreso\n` +
        `   Prioridad: Alta\n\n` +
        `📍 INC-002: Error en reportes\n` +
        `   Estado: Abierta\n` +
        `   Prioridad: Media\n\n` +
        `Total: 2 incidencias activas`;
    }

    return `🎫 Para gestión de incidencias:\n` +
      `• "crear incidencia" - Nueva incidencia\n` +
      `• "estado incidencias" - Ver activas\n` +
      `• "incidencia INC-XXX" - Ver detalle`;
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
          `${this.azureOpenAIEndpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview`,
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
      return this.getDefaultResponse(message);
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