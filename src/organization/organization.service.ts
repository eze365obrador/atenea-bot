import { Injectable } from '@nestjs/common';
import { SharePointService } from './sharepoint.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class OrganizationService {
  constructor(
    private sharePointService: SharePointService,
    private aiService: AiService,
  ) {}

  async processOrganizationQuery(message: string): Promise<{ message: string }> {
    try {
      // Intentar obtener información de SharePoint primero
      let sharepointResponse = '';
      try {
        sharepointResponse = await this.sharePointService.answerQuestion(message);
      } catch (error) {
        console.log('SharePoint not available, using fallback data');
      }

      // Si SharePoint proporcionó una respuesta útil, usarla
      if (sharepointResponse && !sharepointResponse.includes('No encontré información')) {
        return { message: sharepointResponse };
      }

      // Fallback: usar datos estáticos si SharePoint no está disponible
      const prompt = `
Eres Atenea respondiendo sobre políticas y organización de la empresa.

CONSULTA: "${message}"

INFORMACIÓN DISPONIBLE:
- Vacaciones: 22 días laborables/año (solicitar 15 días antes)
- Horario: L-J 9:00-18:00, V 9:00-15:00 (verano: horario intensivo)
- Teletrabajo: Máx. 2 días/semana con aprobación
- Permisos: Via sistema interno, requiere aprobación supervisor
- Beneficios: Seguro médico, formación, comedor subvencionado
- Bajas: Notificar en las primeras 24h, presentar justificante médico
- Formación: Presupuesto anual de 1000€ por empleado

NOTA: Esta información es de referencia. Para datos actualizados, consulta los documentos oficiales en SharePoint.

INSTRUCCIONES:
- Responde directamente a lo que preguntan
- Sé claro y preciso con las políticas
- Si no tienes la info exacta, sugiere contactar RRHH
- Mantén tono profesional pero cercano
- Menciona que pueden haber actualizaciones en SharePoint

Respuesta:`;

      const response = await this.aiService.generateContentWithContext(prompt);
      return { message: response };
      
    } catch (error) {
      console.error('Error processing organization query:', error);
      return { 
        message: 'Error al procesar tu consulta organizativa. Por favor, intenta de nuevo.' 
      };
    }
  }
}