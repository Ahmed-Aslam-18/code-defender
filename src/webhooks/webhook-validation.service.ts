import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhooks } from '@octokit/webhooks';

export type WebhookVerifyMeta = {
  usedParsedBodyFallback: boolean;
};

@Injectable()
export class WebhookValidationService {
  private readonly logger = new Logger(WebhookValidationService.name);
  private readonly webhooks: Webhooks | null;
  /** Length only — helps confirm env loaded without logging the secret. */
  private readonly webhookSecretLength: number;

  constructor(private readonly configService: ConfigService) {
    const secret =
      this.configService.get<string>('GITHUB_WEBHOOK_SECRET')?.trim() ||
      process.env.GITHUB_WEBHOOK_SECRET?.trim();

    if (!secret) {
      this.webhookSecretLength = 0;
      this.logger.warn(
        'GITHUB_WEBHOOK_SECRET is not configured. Webhook validation will fail.',
      );
      this.webhooks = null;
    } else {
      this.webhookSecretLength = secret.length;
      this.webhooks = new Webhooks({ secret });
      this.logger.log(
        `Webhook secret loaded from env (length=${this.webhookSecretLength} chars). Must match GitHub App/repo webhook secret exactly.`,
      );
    }
  }

  async validateWebhook(
    body: string,
    signature: string | undefined,
    meta?: WebhookVerifyMeta,
  ): Promise<void> {
    const sigPreview =
      signature && signature.length > 14
        ? `${signature.slice(0, 14)}…`
        : signature ?? 'missing';

    this.logger.log(
      `verify: bodyChars=${body.length} x-hub-signature-256=${sigPreview} sha256PrefixOk=${signature?.startsWith('sha256=') ?? false} parsedBodyFallback=${meta?.usedParsedBodyFallback ?? false}`,
    );

    if (!this.webhooks) {
      this.logger.error('Webhook secret not configured');
      throw new UnauthorizedException('Webhook secret not configured');
    }

    if (!signature) {
      this.logger.error('Missing x-hub-signature-256 header');
      throw new UnauthorizedException('Missing webhook signature');
    }

    try {
      const isValid = await this.webhooks.verify(body, signature);

      if (!isValid) {
        this.logger.error(
          [
            'Invalid webhook signature.',
            meta?.usedParsedBodyFallback
              ? 'Likely cause: verifying JSON.stringify(body) instead of raw bytes — fix Nest rawBody / middleware so req.rawBody is set.'
              : 'Raw body path used — compare GITHUB_WEBHOOK_SECRET with the webhook secret in GitHub (App settings or repo webhook); both must match exactly.',
            `diagnostics: bodyChars=${body.length}, envSecretLength=${this.webhookSecretLength}, signatureFormatOk=${signature.startsWith('sha256=')}`,
          ].join(' '),
        );
        throw new UnauthorizedException('Invalid webhook signature');
      }

      this.logger.log('Webhook signature validated successfully');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Webhook validation failed:', error);
      throw new UnauthorizedException('Webhook validation failed');
    }
  }
}
