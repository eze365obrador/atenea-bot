import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SalesService } from './sales.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ConfigModule, HttpModule, AiModule],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}