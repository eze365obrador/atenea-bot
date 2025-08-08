import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Injectable()
export class IncidentsService {
  private static incidenciaCounter = 1;
  private static incidencias: any[] = [
    {
      id: 'INC001',
      titulo: 'Error en sistema de ventas',
      estado: 'abierta',
      prioridad: 'alta',
      fechaCreacion: new Date(),
      usuarioReportador: 'demo@empresa.com'
    }
  ];

  constructor(private aiService: AiService) {}

  async processIncidentQuery(message: string, userId: string): Promise<{ message: string }> {
    try {
      const messageLower = message.toLowerCase();

      // Detectar intención
      if (messageLower.includes('crear') || messageLower.includes('nueva') || messageLower.includes('reportar')) {
        return await this.crearIncidenciaConIA(message, userId);
      }

      if (messageLower.includes('listar') || messageLower.includes('ver') || messageLower.includes('mis')) {
        return await this.listarIncidenciasConIA(message, userId);
      }

      // Consulta general sobre incidencias
      return await this.consultaGeneralIncidencias(message);

    } catch (error) {
      console.error('Error processing incident query:', error);
      return {
        message: 'Error al procesar tu consulta de incidencias. Por favor, intenta de nuevo.'
      };
    }
  }

  private async crearIncidenciaConIA(message: string, userId: string): Promise<{ message: string }> {
    const prompt = `
Eres Atenea, un asistente para gestión de incidencias de TI.

TAREA: Crear una nueva incidencia basada en la descripción del usuario.

DESCRIPCIÓN DEL USUARIO: "${message}"

INSTRUCCIONES:
1. Extrae el título y descripción de la incidencia
2. Asigna una prioridad (baja, media, alta, crítica) basada en la descripción
3. Asigna una categoría (TI, Hardware, Software, Red, Acceso, Otros)
4. Genera un ID único tipo INC002, INC003, etc.

Responde en formato: 
✅ **Incidencia Creada**

**ID**: #[ID_GENERADO]
**Título**: [título_extraído]  
**Prioridad**: [prioridad]
**Categoría**: [categoría]
**Estado**: Abierta
**Usuario**: ${userId}
**Fecha**: [fecha_actual]

Descripción: [descripción_detallada]

¿Necesitas que realice alguna acción adicional con esta incidencia?`;

    const response = await this.aiService.generateContentWithContext(prompt);

    // Simular agregar a la "base de datos"
    const nuevaId = `INC${String(++IncidentsService.incidenciaCounter).padStart(3, '0')}`;
    IncidentsService.incidencias.push({
      id: nuevaId,
      titulo: 'Incidencia creada via IA',
      estado: 'abierta',
      usuarioReportador: userId,
      fechaCreacion: new Date()
    });

    return { message: response };
  }

  private async listarIncidenciasConIA(message: string, userId: string): Promise<{ message: string }> {
    const incidenciasUsuario = IncidentsService.incidencias.filter(inc => 
      inc.usuarioReportador === userId
    );

    const prompt = `
Eres Atenea, asistente de incidencias.

TAREA: Mostrar las incidencias del usuario de manera organizada.

INCIDENCIAS DEL USUARIO:
${incidenciasUsuario.map(inc => `- ID: ${inc.id}, Título: ${inc.titulo}, Estado: ${inc.estado}`).join('\n')}

CONSULTA: "${message}"

Formatea la respuesta de manera clara con emojis 🎫📋 y ofrece ayuda adicional.`;

    const response = await this.aiService.generateContentWithContext(prompt);
    return { message: response };
  }

  private async consultaGeneralIncidencias(message: string): Promise<{ message: string }> {
    const prompt = `
Eres Atenea, asistente de gestión de incidencias.

CONSULTA DEL USUARIO: "${message}"

CONTEXTO: El usuario está preguntando sobre el sistema de incidencias.

INSTRUCCIONES:
1. Explica cómo funciona el sistema de incidencias
2. Menciona las opciones disponibles (crear, consultar, listar)
3. Usa emojis 🎫🔧📋
4. Ofrece ejemplos de comandos

Responde de manera útil y profesional:`;

    const response = await this.aiService.generateContentWithContext(prompt);
    return { message: response };
  }
}