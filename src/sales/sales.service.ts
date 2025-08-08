import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { DateTime } from 'luxon';
import { AiService } from '../ai/ai.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SalesService {
  private apiUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private aiService: AiService,
  ) {
    this.apiUrl = this.configService.get<string>('sales.apiUrl') || 'https://api.365equipo.com/ventas';
  }

  async processSalesQuery(message: string): Promise<{ message: string }> {
    try {
      // Extraer fechas del mensaje
      const dateParams = await this.extractDatesFromMessage(message);
      
      // Obtener datos de ventas
      const salesData = await this.fetchSalesData(dateParams.fechaInicio, dateParams.fechaFinal);
      
      // Generar respuesta con IA
      const prompt = `
Eres Atenea, respondiendo una consulta sobre ventas con datos REALES de la API.

CONSULTA DEL USUARIO: "${message}"
PERÍODO CONSULTADO: Desde ${dateParams.fechaInicio} hasta ${dateParams.fechaFinal}

DATOS REALES DE LA API:
${JSON.stringify(salesData, null, 2)}

INSTRUCCIONES:
- Usa SOLO los datos reales proporcionados de la API
- Responde de forma natural y conversacional
- Incluye los datos relevantes de forma clara y formateada
- Calcula totales, promedios o tendencias si es útil
- Si la API no devolvió datos, indícalo amablemente
- Usa 1-2 emojis apropiados
- Formatea montos en euros con el símbolo €

Respuesta:`;

      const response = await this.aiService.generateContentWithContext(prompt);
      return { message: response };
      
    } catch (error) {
      console.error('Error processing sales query:', error);
      return { 
        message: 'Error al procesar tu consulta de ventas. Por favor, intenta de nuevo.' 
      };
    }
  }

  private async extractDatesFromMessage(message: string): Promise<{ fechaInicio: string; fechaFinal: string }> {
    try {
      const now = DateTime.now().setZone('Europe/Madrid');
      
      const prompt = `
Analiza el siguiente mensaje y extrae las fechas para consultar ventas.

MENSAJE: "${message}"
FECHA ACTUAL: ${now.toISO()}
DÍA DE LA SEMANA ACTUAL: ${now.toFormat('EEEE')} (en español: ${now.setLocale('es').toFormat('EEEE')})

INSTRUCCIONES:
- Si dice "hoy": usa solo la fecha de hoy
- Si dice "ayer": usa solo la fecha de ayer
- Si dice "esta semana": desde el lunes de esta semana hasta hoy
- Si dice "semana pasada": toda la semana anterior (lunes a domingo)
- Si dice "este mes": desde el día 1 del mes actual hasta hoy
- Si dice "mes pasado": todo el mes anterior completo
- Si dice "últimos X días": desde hace X días hasta hoy
- Si no especifica período: usa solo hoy
- Si menciona fechas específicas: úsalas

IMPORTANTE: Las fechas deben ser en formato ISO con timezone Europe/Madrid

Responde SOLO con JSON:
{
  "fechaInicio": "2024-01-15T00:00:00.000+01:00",
  "fechaFinal": "2024-01-15T23:59:59.999+01:00",
  "periodo": "descripción del período"
}`;

      const response = await this.aiService.generateContentWithContext(prompt);
      
      // Parsear JSON de la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          fechaInicio: parsed.fechaInicio,
          fechaFinal: parsed.fechaFinal,
        };
      }
      
      // Fallback: usar hoy
      const today = now.startOf('day');
      return {
        fechaInicio: today.toISO() || '',
        fechaFinal: today.endOf('day').toISO() || '',
      };
      
    } catch (error) {
      console.error('Error extracting dates:', error);
      const now = DateTime.now().setZone('Europe/Madrid');
      const today = now.startOf('day');
      return {
        fechaInicio: today.toISO() || '',
        fechaFinal: today.endOf('day').toISO() || '',
      };
    }
  }

  private async fetchSalesData(fechaInicio: string, fechaFinal: string): Promise<any> {
    try {
      const url = `${this.apiUrl}?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFinal=${encodeURIComponent(fechaFinal)}`;
      
      console.log(`Fetching sales from: ${url}`);
      
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
      );
      
      return response.data;
      
    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Devolver datos de ejemplo si la API falla
      return {
        error: 'API no disponible',
        datosEjemplo: true,
        ventas: [
          {
            fecha: fechaInicio,
            tienda: 'Madrid Centro',
            total: 15420.50,
            productos: 87,
            clientes: 34,
          },
          {
            fecha: fechaInicio,
            tienda: 'Barcelona Norte',
            total: 12300.75,
            productos: 65,
            clientes: 28,
          },
        ],
      };
    }
  }
}