import { Controller, Post } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly webhooksService: WebhooksService) {}


    @Post()
    createWebhook(@Body() webhook: any) {
        console.log(webhook);
        return this.webhooksService.addWebhook(webhook);
    }
}
