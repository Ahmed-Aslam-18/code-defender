jest.mock('@octokit/webhooks', () => ({
  Webhooks: jest.fn().mockImplementation(() => ({
    verify: jest.fn().mockResolvedValue(true),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookValidationService } from './webhook-validation.service';

describe('WebhooksController', () => {
  let controller: WebhooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: WebhooksService,
          useValue: { addWebhook: jest.fn() },
        },
        {
          provide: WebhookValidationService,
          useValue: { validateWebhook: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
