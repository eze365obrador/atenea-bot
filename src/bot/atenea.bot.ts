import { 
  ActivityHandler, 
  TurnContext, 
  MessageFactory,
  CardFactory,
  ActionTypes 
} from 'botbuilder';
import { Injectable } from '@nestjs/common';
import { AIMessageService } from './ai-message.service';

@Injectable()
export class AteneaBot extends ActivityHandler {
  constructor(private aiService: AIMessageService) {
    super();

    this.onMessage(async (context: TurnContext, next) => {
      console.log(`[AteneaBot] Message received: ${context.activity.text}`);
      
      const userMessage = context.activity.text;
      const userId = context.activity.from.id;
      
      await context.sendActivity({ type: 'typing' });
      
      try {
        const response = await this.aiService.processMessage(userId, userMessage);
        
        if (response.includes('**')) {
          const formattedResponse = this.formatMarkdown(response);
          await context.sendActivity(MessageFactory.text(formattedResponse));
        } else {
          await context.sendActivity(MessageFactory.text(response));
        }
        
        if (userMessage.toLowerCase().includes('ayuda')) {
          await this.sendQuickActions(context);
        }
        
      } catch (error) {
        console.error('[AteneaBot] Error processing message:', error);
        await context.sendActivity(
          MessageFactory.text('Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.')
        );
      }
      
      await next();
    });

    this.onMembersAdded(async (context: TurnContext, next) => {
      const membersAdded = context.activity.membersAdded || [];
      
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          const welcomeCard = this.createWelcomeCard();
          await context.sendActivity(MessageFactory.attachment(welcomeCard));
        }
      }
      
      await next();
    });

    this.onMessageReaction(async (context: TurnContext, next) => {
      const { reactionAdded, reactionRemoved } = context.activity as any;
      
      if (reactionAdded && reactionAdded.includes('like')) {
        await context.sendActivity('¡Gracias por tu feedback! 👍');
      }
      
      await next();
    });
  }

  private formatMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\n/g, '\n\n');
  }

  private createWelcomeCard() {
    const card = {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.3',
      body: [
        {
          type: 'Container',
          items: [
            {
              type: 'TextBlock',
              text: '🤖 ¡Bienvenido a Atenea!',
              weight: 'Bolder',
              size: 'Large',
              color: 'Accent'
            },
            {
              type: 'TextBlock',
              text: 'Tu asistente empresarial inteligente',
              size: 'Medium',
              isSubtle: true,
              wrap: true
            }
          ]
        },
        {
          type: 'Container',
          items: [
            {
              type: 'TextBlock',
              text: 'Puedo ayudarte con:',
              weight: 'Bolder',
              wrap: true
            },
            {
              type: 'FactSet',
              facts: [
                {
                  title: '📊 Ventas',
                  value: 'Métricas y reportes'
                },
                {
                  title: '🎫 Incidencias',
                  value: 'Crear y gestionar'
                },
                {
                  title: '📚 Documentación',
                  value: 'Políticas y manuales'
                },
                {
                  title: '💡 Soporte',
                  value: 'Respuestas rápidas'
                }
              ]
            }
          ]
        },
        {
          type: 'Container',
          items: [
            {
              type: 'TextBlock',
              text: '¿Cómo puedo ayudarte hoy?',
              weight: 'Bolder',
              color: 'Accent',
              wrap: true
            }
          ]
        }
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: '📊 Ver ventas de hoy',
          data: {
            action: 'ventas de hoy'
          }
        },
        {
          type: 'Action.Submit',
          title: '🎫 Crear incidencia',
          data: {
            action: 'crear incidencia'
          }
        },
        {
          type: 'Action.Submit',
          title: '❓ Ver ayuda',
          data: {
            action: 'ayuda'
          }
        }
      ]
    };

    return CardFactory.adaptiveCard(card);
  }

  private async sendQuickActions(context: TurnContext) {
    const suggestedActions = MessageFactory.suggestedActions(
      ['Ventas de hoy', 'Crear incidencia', 'Estado incidencias', 'Política vacaciones'],
      'Acciones rápidas:'
    );
    
    await context.sendActivity(suggestedActions);
  }
}