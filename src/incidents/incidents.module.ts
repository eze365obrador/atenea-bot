import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IncidentsService } from './incidents.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ConfigModule, AiModule],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}