import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhooksProcessor } from './webhooks.processor';
import { GithubService } from './services/github.service';
import { AIReviewService } from './services/ai-review.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhooks',
    }),
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhooksProcessor,
    GithubService,
    AIReviewService,
  ],
})
export class WebhooksModule {}
