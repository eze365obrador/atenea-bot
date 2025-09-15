import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotController } from './bot.controller';
import { BotAdapter } from './bot.adapter';
import { AteneaBot } from './atenea.bot';
import { AIMessageService } from './ai-message.service';
import { HttpModule } from '@nestjs/axios';
import { AiModule } from '../ai/ai.module';
import { SalesModule } from '../sales/sales.module';
import { OrganizationModule } from '../organization/organization.module';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    // Servicios que el bot puede invocar según el plan del router IA
    AiModule,
    SalesModule,
    OrganizationModule,
    IncidentsModule,
  ],
  controllers: [BotController],
  providers: [BotAdapter, AteneaBot, AIMessageService],
  exports: [BotAdapter, AteneaBot],
})
export class BotModule {}
