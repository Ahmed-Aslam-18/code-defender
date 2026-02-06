import { Controller, Headers, Post } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly webhooksService: WebhooksService) { }


    @Post()
    createWebhook(@Body() webhook: any,
        @Headers('x-github-event') event: string,
    ) {
        if (event === 'pull_request') {
            if(webhook.action === 'opened') {
                return this.webhooksService.addWebhook(webhook);
            } else {
                return {
                    message: 'Pull request not opened',
                };
            }
        }
    }
}
