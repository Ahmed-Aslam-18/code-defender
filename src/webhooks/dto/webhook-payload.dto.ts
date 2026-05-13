export interface WebhookPayloadDto {
  number: number;
  /** Present for GitHub App webhooks; omitted for repository webhooks (use `GITHUB_TOKEN`). */
  installation?: {
    id: number;
  };
  repository: {
    owner: {
      login: string;
    };
    name: string;
  };
  pull_request: {
    head: {
      sha: string;
    };
  };
}
