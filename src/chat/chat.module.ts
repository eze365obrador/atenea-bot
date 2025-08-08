import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AiModule } from '../ai/ai.module';
import { SalesModule } from '../sales/sales.module';
import { OrganizationModule } from '../organization/organization.module';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [AiModule, SalesModule, OrganizationModule, IncidentsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}