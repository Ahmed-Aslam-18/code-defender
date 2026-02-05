import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class WebhooksService {
    constructor(@InjectQueue('webhooks') private readonly bullQueue: Queue) {}

    async addWebhook(webhook: any) {
        await this.bullQueue.add('webhook', webhook, {
            delay: 1000,
        });

        return {
            message: 'Webhook added to queue',
        };
    }

}
