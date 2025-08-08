import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotController } from './bot.controller';
import { BotAdapter } from './bot.adapter';
import { AteneaBot } from './atenea.bot';
import { AIMessageService } from './ai-message.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [BotController],
  providers: [BotAdapter, AteneaBot, AIMessageService],
  exports: [BotAdapter, AteneaBot],
})
export class BotModule {}