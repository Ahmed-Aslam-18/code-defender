import { Controller, Headers, Logger, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { WebhookValidationService } from './webhook-validation.service';

interface RequestWithRawBody extends Request {
    rawBody?: Buffer;
}

@Controller('webhooks')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

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
        const usedParsedBodyFallback = !req.rawBody?.length;
        const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(req.body);
        const contentLength = req.headers['content-length'];

        this.logger.log(
            [
                `incoming webhook`,
                `event=${event ?? 'missing'}`,
                `rawBodyPresent=${!usedParsedBodyFallback}`,
                `rawBodyBytes=${req.rawBody?.length ?? 0}`,
                `stringUsedForVerifyChars=${rawBody.length}`,
                `content-length=${contentLength ?? 'n/a'}`,
                `signatureHeaderPresent=${Boolean(signature)}`,
            ].join(' | '),
        );

        if (usedParsedBodyFallback) {
            this.logger.warn(
                'req.rawBody missing — using JSON.stringify(body); GitHub signature verification usually fails unless rawBody is populated (see Nest rawBody: true).',
            );
        }

        await this.webhookValidationService.validateWebhook(rawBody, signature, {
            usedParsedBodyFallback,
        });
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
