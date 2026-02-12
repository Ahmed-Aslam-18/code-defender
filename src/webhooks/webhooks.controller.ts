import { Controller, Headers, Post, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookValidationService } from './webhook-validation.service';

interface RequestWithRawBody {
    rawBody?: Buffer;
    body: any;
}

@Controller('webhooks')
export class WebhooksController {
    constructor(
        private readonly webhooksService: WebhooksService,
        private readonly webhookValidationService: WebhookValidationService,
    ) { }

    @Post()
    async createWebhook(
        @Req() req: RequestWithRawBody,
        @Headers('x-github-event') event: string,
        @Headers('x-hub-signature-256') signature: string,
    ) {
        const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(req.body);
        await this.webhookValidationService.validateWebhook(rawBody, signature);
        const webhook = req.body;

        if (event === 'pull_request') {
            if(webhook.action === 'opened') {
                return this.webhooksService.addWebhook(webhook);
            } else {
                return {
                    message: 'Pull request not opened',
                };
            }
        }

        return {
            message: 'Event received but not processed',
        };
    }
}
