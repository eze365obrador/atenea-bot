import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrganizationService } from './organization.service';
import { SharePointService } from './sharepoint.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ConfigModule, AiModule],
  providers: [OrganizationService, SharePointService],
  exports: [OrganizationService],
})
export class OrganizationModule {}