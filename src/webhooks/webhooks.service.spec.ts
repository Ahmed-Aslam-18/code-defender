import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  const mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

  function createModule(configGet: (key: string) => string | undefined) {
    return Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: getQueueToken('webhooks'),
          useValue: mockQueue,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => configGet(key)) },
        },
      ],
    }).compile();
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await createModule(() => undefined);
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

  it('addWebhook rejects missing installation when GITHUB_TOKEN unset', async () => {
    const payloadWithoutInstallation = {
      number: 1,
      repository: { owner: { login: 'o' }, name: 'r' },
      pull_request: { head: { sha: 'abc' } },
    };
    await expect(
      service.addWebhook(payloadWithoutInstallation as never),
    ).rejects.toThrow();
  });

  it('addWebhook enqueues without installation when GITHUB_TOKEN is set', async () => {
    const module = await createModule((key) =>
      key === 'GITHUB_TOKEN' ? 'pat-token' : undefined,
    );
    service = module.get<WebhooksService>(WebhooksService);

    await service.addWebhook({
      number: 2,
      repository: { owner: { login: 'o' }, name: 'r' },
      pull_request: { head: { sha: 'def' } },
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      'webhook',
      expect.objectContaining({
        number: 2,
      }),
      expect.any(Object),
    );
    const callPayload = mockQueue.add.mock.calls[0][1] as {
      installation?: { id: number };
    };
    expect(callPayload.installation).toBeUndefined();
  });
});
