export interface WebhookPayloadDto {
  number: number;
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
