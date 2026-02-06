import { Job } from 'bullmq';
import { Processor } from '@nestjs/bullmq';
import { WorkerHost } from '@nestjs/bullmq';
import { Octokit } from 'octokit';
import { ConfigService } from '@nestjs/config';
import { PRFiles, PRFile } from './pr-file.type';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {

    constructor(private config: ConfigService) {
        super();
    }

    async process(job: Job<any>): Promise<any> {
        console.log(job.data);
        console.log('Ahmed');
        console.log(job.data.number);
        console.log(job.data.repository.owner.login);
        console.log(job.data.repository.name);

        const files = await this.getFileForPR(job.data.number, job.data.repository.owner.login, job.data.repository.name);
        const reviewableFiles = files.filter((f: PRFile) =>
            f.patch &&
            f.filename.endsWith('.ts')
          );
       const response = await this.getResponse(reviewableFiles);

        return 'In progress';
    }

    async getFileForPR(pullRequestNumber: number, owner: string, repo: string): Promise<any> {
        console.log(this.getGithubToken());
        const octokit = new Octokit({ auth: this.getGithubToken() });

        const { data: PRFiles } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
            owner: owner,
            repo: repo,
            pull_number: pullRequestNumber
          });

        console.log('response', PRFiles);

        return PRFiles;
    }

    async getResponse(files: PRFiles) {
        const ai = new GoogleGenAI({apiKey: this.getGeminiApiKey()});

        const responses: string[] = [];
        for (const file of files) {
            if (file.patch) {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: this.getPrompt(file.patch),
                  });
            responses.push(response.text || 'No response');
        }
        }
        console.log('//////////////////');
        console.log('responses', responses);
        console.log('//////////////////');
        return responses;
    }

    getGithubToken() {
        return this.config.get<string>('GITHUB_TOKEN');
      }

      getOpenAIKey() {
        return this.config.get<string>('OPENAI_API_KEY');
      }

      getGeminiApiKey() {
        return this.config.get<string>('GEMINI_API_KEY');
      }

      getPrompt(patch: string) {
        return `
        You are a senior software engineer performing a strict PR review.

        Focus on:

        - bugs
        - security issues
        - performance problems
        - bad practices
        - readability
        - missing tests

        DO NOT praise.
        DO NOT explain obvious things.
        ONLY report actionable issues.

        Return JSON:

        [
        {
        "line": number,
        "severity": "low | medium | high",
        "comment": "text"
        }
        ]

        Here is the git diff:
        ${patch}
        `;
      }
}
