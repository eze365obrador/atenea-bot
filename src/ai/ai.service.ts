import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey') || 'demo-key';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async determineModule(message: string): Promise<{ module: string; confidence: number }> {
    try {
      const prompt = `
Analiza el siguiente mensaje y determina a qué módulo del sistema debe dirigirse.

MENSAJE DEL USUARIO: "${message}"

MÓDULOS DISPONIBLES:
1. "ventas" - Consultas sobre ventas, ingresos, métricas de tiendas, productos vendidos, rendimiento comercial, facturación, datos de clientes
2. "organizacion" - Políticas empresariales, manuales, RRHH, vacaciones, permisos, horarios, procedimientos, normativas, beneficios laborales
3. "incidencias" - Crear tickets de soporte, reportar problemas técnicos, errores del sistema, solicitudes de ayuda técnica, consultar estado de tickets
4. "general" - Saludos, preguntas personales, consultas que no encajan en los otros módulos, preguntas sobre el asistente

INSTRUCCIONES:
- Analiza el CONTEXTO y la INTENCIÓN del mensaje, no solo palabras clave
- Si el usuario saluda o hace preguntas personales, usa "general"
- Si hay duda entre módulos, elige el más probable según el contexto
- Responde SOLO con JSON válido

Responde en este formato JSON exacto:
{
  "module": "nombre_del_modulo",
  "confidence": 0.9,
  "reason": "breve explicación"
}`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Intentar parsear el JSON de la respuesta
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            module: parsed.module || 'general',
            confidence: parsed.confidence || 0.5,
          };
        }
      } catch (parseError) {
        console.error('Error parsing AI module decision:', parseError);
      }
      
      return { module: 'general', confidence: 0.5 };
      
    } catch (error) {
      console.error('Error in AI module determination:', error);
      return { module: 'general', confidence: 0.3 };
    }
  }

  async generateGeneralResponse(message: string, userId: string): Promise<{ message: string }> {
    try {
      const prompt = `
Eres Atenea, un asistente empresarial inteligente. Eres conversacional, amigable y profesional.

MENSAJE DEL USUARIO: "${message}"
ID DEL USUARIO: ${userId}

INSTRUCCIONES IMPORTANTES:
- Responde de manera NATURAL y CONVERSACIONAL a lo que el usuario pregunta específicamente
- NO repitas siempre el mismo mensaje de presentación
- Si te preguntan algo personal (tu nombre, cómo te llamas, etc.), responde naturalmente
- Si te preguntan algo que no sabes, admítelo de forma amigable
- Solo menciona tus capacidades (ventas, organización, incidencias) si es relevante o si el usuario lo pregunta
- Sé breve y directo en tus respuestas
- Mantén un tono profesional pero cercano
- Usa emojis con moderación y solo cuando sea apropiado

CONTEXTO SOBRE TI:
- Tu nombre es Atenea
- Eres un asistente de IA para la empresa
- Puedes ayudar con ventas, información organizativa e incidencias
- No tienes acceso a información personal del usuario a menos que te la proporcione

Responde de manera natural y conversacional:`;

      const result = await this.model.generateContent(prompt);
      return { message: result.response.text() };
      
    } catch (error) {
      console.error('Error generating general response:', error);
      return { 
        message: '¡Hola! Soy Atenea, tu asistente empresarial. ¿En qué puedo ayudarte hoy?' 
      };
    }
  }

  async generateContentWithContext(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }
}