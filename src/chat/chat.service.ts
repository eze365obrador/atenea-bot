import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { SalesService } from '../sales/sales.service';
import { OrganizationService } from '../organization/organization.service';
import { IncidentsService } from '../incidents/incidents.service';
import { ChatDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly aiService: AiService,
    private readonly salesService: SalesService,
    private readonly organizationService: OrganizationService,
    private readonly incidentsService: IncidentsService,
  ) {}

  async processMessage(chatDto: ChatDto) {
    try {
      // Determinar el módulo usando IA
      const moduleDecision = await this.aiService.determineModule(chatDto.message);
      
      let response;
      switch (moduleDecision.module) {
        case 'ventas':
          response = await this.salesService.processSalesQuery(chatDto.message);
          break;
        case 'organizacion':
          response = await this.organizationService.processOrganizationQuery(chatDto.message);
          break;
        case 'incidencias':
          response = await this.incidentsService.processIncidentQuery(chatDto.message, chatDto.userId);
          break;
        default:
          response = await this.aiService.generateGeneralResponse(chatDto.message, chatDto.userId);
      }

      return {
        success: true,
        mensaje: response.message,
        module: moduleDecision.module,
        confidence: moduleDecision.confidence,
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        success: false,
        mensaje: 'Error procesando tu consulta. Por favor, intenta de nuevo.',
        module: 'error',
        confidence: 0,
      };
    }
  }
}