import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhooks } from '@octokit/webhooks';

@Injectable()
export class WebhookValidationService {
  private readonly logger = new Logger(WebhookValidationService.name);
  private readonly webhooks: Webhooks;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
    
    if (!secret) {
      console.log('GITHUB_WEBHOOK_SECRET is not configured. Webhook validation will fail.');
    }

    this.webhooks = new Webhooks({
      secret: secret || '',
    });
  }

  async validateWebhook(body: string, signature: string | undefined): Promise<void> {
    if (!signature) {
      this.logger.error('Missing x-hub-signature-256 header');
      throw new UnauthorizedException('Missing webhook signature');
    }

    try {
      const isValid = await this.webhooks.verify(body, signature);
      
      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }

      this.logger.log('Webhook signature validated successfully');
    } catch (error) {
      this.logger.error('Webhook validation failed:', error);
      throw new UnauthorizedException('Webhook validation failed');
    }
  }
}
