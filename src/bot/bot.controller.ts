import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { BotAdapter } from './bot.adapter';
import { AteneaBot } from './atenea.bot';

@Controller('api/messages')
export class BotController {
  constructor(
    private adapter: BotAdapter,
    private bot: AteneaBot,
  ) {}

  @Post()
  async messages(@Req() req: Request, @Res() res: Response) {
    console.log('[BotController] Received message');
    
    await this.adapter.processActivity(req, res, async (context) => {
      await this.bot.run(context);
    });
  }
}