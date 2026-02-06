import { Job } from 'bullmq';
import { Processor } from '@nestjs/bullmq';
import { WorkerHost } from '@nestjs/bullmq';
import { Octokit } from 'octokit';
import { ConfigService } from '@nestjs/config';
import { PRFiles, PRFile } from './pr-file.type';
import { GoogleGenAI } from '@google/genai';

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {

    constructor(private config: ConfigService) {
        super();
    }

    async process(job: Job<any>): Promise<any> {
        try {
            const files = await this.getFileForPR(job.data.number, job.data.repository.owner.login, job.data.repository.name);
            const reviewableFiles = files.filter((f: PRFile) =>
                f.patch &&
                f.filename.endsWith('.ts')
              );
           console.log('reviewableFiles', reviewableFiles.length);
           console.log('About to call getResponse...');
           const response = await this.getResponse(reviewableFiles);
           console.log('getResponse completed');

            return 'In progress';
        } catch (error) {
            console.error('Error in process:', error);
            throw error;
        }
    }

    async getFileForPR(pullRequestNumber: number, owner: string, repo: string): Promise<any> {
        const octokit = new Octokit({ auth: this.getGithubToken() });

        const { data: PRFiles } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
            owner: owner,
            repo: repo,
            pull_number: pullRequestNumber
          });

        return PRFiles;
    }

    async getResponse(files: PRFiles) {
        try {
            console.log("In Code Reviewer");
            const apiKey = this.getGeminiApiKey();
            console.log('API Key exists:', !!apiKey);
            
            const ai = new GoogleGenAI({apiKey: apiKey});
            console.log("GoogleGenAI client created");

            const responses: string[] = [];
            for (const file of files) {
                if (file.patch) {
                    console.log(`Processing file: ${file.filename}`);
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
        } catch (error) {
            console.error('Error in getResponse:', error);
            throw error;
        }
    }

    getGithubToken() {
        return this.config.get<string>('GITHUB_TOKEN');
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
