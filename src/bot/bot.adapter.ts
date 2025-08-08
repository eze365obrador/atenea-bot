import { BotFrameworkAdapter, TurnContext } from 'botbuilder';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotAdapter extends BotFrameworkAdapter {
  constructor(private configService: ConfigService) {
    super({
      appId: configService.get('MICROSOFT_APP_ID'),
      appPassword: configService.get('MICROSOFT_APP_PASSWORD'),
    });

    this.onTurnError = async (context: TurnContext, error: Error) => {
      console.error('[BotAdapter] Error:', error);
      
      try {
        await context.sendActivity('❌ Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.');
        
        await context.sendActivity({
          type: 'trace',
          text: `Error: ${error.message}`,
        });
      } catch (err) {
        console.error('[BotAdapter] Error sending error message:', err);
      }
    };
  }
}