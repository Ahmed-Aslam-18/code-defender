import { BadRequestException, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@Injectable()
export class WebhooksService {
  constructor(@InjectQueue('webhooks') private readonly bullQueue: Queue) {}

  async addWebhook(webhook: {
    number: number;
    installation?: { id: number };
    repository: {
      owner: { login: string };
      name: string;
    };
    pull_request: { head: { sha: string } };
  }) {
    const installationId = webhook.installation?.id;
    if (installationId == null) {
      throw new BadRequestException(
        'Missing installation id. Use a GitHub App webhook with the app installed on this repository.',
      );
    }

    const payload: WebhookPayloadDto = {
      number: webhook.number,
      installation: { id: installationId },
      repository: {
        owner: { login: webhook.repository.owner.login },
        name: webhook.repository.name,
      },
      pull_request: {
        head: { sha: webhook.pull_request.head.sha },
      },
    };

    await this.bullQueue.add('webhook', payload, {
      delay: 1000,
    });

    return {
      message: 'Webhook added to queue',
    };
  }
}
