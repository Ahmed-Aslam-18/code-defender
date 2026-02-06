import { Job } from 'bullmq';
import { Processor } from '@nestjs/bullmq';
import { WorkerHost } from '@nestjs/bullmq';
import { Octokit } from 'octokit';
import { ConfigService } from '@nestjs/config';

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {

    constructor(private config: ConfigService) {
        super();
    }

    async process(job: Job<any>): Promise<any> {
        console.log(job.data);
        console.log('Ahmed');
        console.log(job.data.number);

        const files = await this.getFileForPR(job.data.number, job.data.repository.owner.name, job.data.repository.name);
        console.log(files);
        return job.data;
    }

    async getFileForPR(pullRequestNumber: number, owner: string, repo: string): Promise<any> {
        console.log(this.getGithubToken());
        const octokit = new Octokit({ auth: this.getGithubToken() });

        const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
            owner: owner,
            repo: repo,
            pull_number: pullRequestNumber
          });

        return response.data;
    }

    getGithubToken() {
        return this.config.get<string>('GITHUB_TOKEN');
      }
}
