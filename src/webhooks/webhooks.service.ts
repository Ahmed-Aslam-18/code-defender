import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectQueue('webhooks') private readonly bullQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

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
    const pat =
      this.configService.get<string>('GITHUB_TOKEN')?.trim() ||
      process.env.GITHUB_TOKEN?.trim();

    if (installationId == null && !pat) {
      throw new BadRequestException(
        'Missing installation id (GitHub App webhook). For repository webhooks, set GITHUB_TOKEN in .env.',
      );
    }

    const payload: WebhookPayloadDto = {
      number: webhook.number,
      ...(installationId != null ? { installation: { id: installationId } } : {}),
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
