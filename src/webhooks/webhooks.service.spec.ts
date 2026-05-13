import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  const mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: getQueueToken('webhooks'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('addWebhook enqueues payload with installation id', async () => {
    await service.addWebhook({
      number: 1,
      installation: { id: 99 },
      repository: { owner: { login: 'o' }, name: 'r' },
      pull_request: { head: { sha: 'abc' } },
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      'webhook',
      expect.objectContaining({
        installation: { id: 99 },
        number: 1,
      }),
      expect.any(Object),
    );
  });

  it('addWebhook rejects missing installation', async () => {
    const payloadWithoutInstallation = {
      number: 1,
      repository: { owner: { login: 'o' }, name: 'r' },
      pull_request: { head: { sha: 'abc' } },
    };
    await expect(
      service.addWebhook(payloadWithoutInstallation as never),
    ).rejects.toThrow();
  });
});
