import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAppAuth } from '@octokit/auth-app';
import * as fs from 'fs';
import { Octokit } from 'octokit';
import * as path from 'path';
import { PRFiles } from '../pr-file.type';

function normalizePrivateKey(key: string): string {
  return key.trim().replace(/\\n/g, '\n');
}

/** Inline PEM, or path to a `.pem` file (relative to cwd unless absolute). */
function loadPrivateKey(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('BEGIN')) {
    return normalizePrivateKey(trimmed);
  }
  const keyPath = path.isAbsolute(trimmed)
    ? trimmed
    : path.join(process.cwd(), trimmed);
  if (!fs.existsSync(keyPath)) {
    throw new Error(`GITHUB_APP_PRIVATE_KEY file not found: ${keyPath}`);
  }
  return normalizePrivateKey(fs.readFileSync(keyPath, 'utf8'));
}

@Injectable()
export class GithubService {
  private readonly appId: string | undefined;
  private readonly privateKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const appId = this.configService.get<string>('GITHUB_APP_ID')?.trim();
    const rawKey =
      this.configService.get<string>('GITHUB_APP_PRIVATE_KEY')?.trim() ||
      process.env.GITHUB_APP_PRIVATE_KEY?.trim();

    if (appId && rawKey) {
      this.appId = appId;
      this.privateKey = loadPrivateKey(rawKey);
    }
  }

  private assertGithubConfigured(): void {
    if (!this.appId || !this.privateKey) {
      throw new Error(
        'GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be configured',
      );
    }
  }

  private getOctokitForInstallation(installationId: number): Octokit {
    this.assertGithubConfigured();
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        installationId,
      },
    });
  }

  /** App installation auth, or PAT when `installationId` is omitted (repository webhooks). */
  private getOctokit(installationId: number | undefined): Octokit {

    console.log('Dummy console log for testing');
    if (installationId != null) {
      return this.getOctokitForInstallation(installationId);
    }
    const token =
      this.configService.get<string>('GITHUB_TOKEN')?.trim() ||
      process.env.GITHUB_TOKEN?.trim();
    if (!token) {
      throw new Error(
        'GITHUB_TOKEN must be configured for repository webhooks (payload has no installation id)',
      );
    }
    return new Octokit({ auth: token });
  }

  async getPullRequestFiles(
    installationId: number | undefined,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<PRFiles> {
    const octokit = this.getOctokit(installationId);
    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
      {
        owner,
        repo,
        pull_number: pullNumber,
      },
    );

    return data;
  }

  async postReviewComment(
    installationId: number | undefined,
    owner: string,
    repo: string,
    pullNumber: number,
    commitId: string,
    path: string,
    line: number,
    comment: string,
  ): Promise<void> {
    const octokit = this.getOctokit(installationId);
    await octokit.request(
      'POST /repos/{owner}/{repo}/pulls/{pull_number}/comments',
      {
        owner,
        repo,
        pull_number: pullNumber,
        commit_id: commitId,
        path,
        line,
        body: comment,
      },
    );
  }
}
