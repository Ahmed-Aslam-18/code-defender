import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PRFile } from './pr-file.type';
import { AIReviewComment } from './ai-review-comment';
import { GithubService } from './services/github.service';
import { AIReviewService } from './services/ai-review.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { GithubReviewCommentDto } from './dto/github-review-comment.dto';
import { isFileReviewable } from './constants/file-filters.constant';

@Injectable()
@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhooksProcessor.name);

  constructor(
    private readonly githubService: GithubService,
    private readonly aiReviewService: AIReviewService,
  ) {
    super();
  }

  async process(job: Job<WebhookPayloadDto>): Promise<string> {
    const { number, repository, pull_request } = job.data;
    const owner = repository.owner.login;
    const repo = repository.name;
    const commitId = pull_request.head.sha;

    this.logger.log(`Processing PR #${number} from ${owner}/${repo}`);

    try {
      const files = await this.githubService.getPullRequestFiles(
        owner,
        repo,
        number,
      );

      const reviewableFiles = this.filterReviewableFiles(files);
      this.logger.log(`Found ${reviewableFiles.length} reviewable files`);

      if (reviewableFiles.length === 0) {
        this.logger.log('No files to review');
        return 'No reviewable files found';
      }

      const allReviewComments = await this.reviewFiles(
        reviewableFiles,
        commitId,
      );
      this.logger.log('All review comments collected', allReviewComments);

      for (const comment of allReviewComments) {
        try {
          await this.githubService.postReviewComment(
            owner,
            repo,
            number,
            comment.commitId,
            comment.path,
            comment.line,
            comment.comment,
          );
        } catch (error) {
          this.logger.error(`Failed to post comment on ${comment.path}:${comment.line}`, error);
        }
      }

      this.logger.log(
        `Review completed with ${allReviewComments.length} comments posted`,
      );

      return `Reviewed ${reviewableFiles.length} files, found ${allReviewComments.length} issues`;
    } catch (error) {
      this.logger.error(`Error processing PR #${number}:`, error);
      throw error;
    }
  }

  private filterReviewableFiles(files: PRFile[]): PRFile[] {
    return files.filter(
      (file) => file.patch && isFileReviewable(file.filename),
    );
  }

  private async reviewFiles(
    files: PRFile[],
    commitId: string,
  ): Promise<GithubReviewCommentDto[]> {
    const allComments: GithubReviewCommentDto[] = [];

    console.log('commitId', commitId);

    for (const file of files) {
      if (!file.patch) continue;

      try {
        const comments = await this.aiReviewService.reviewCodePatch(
          file.filename,
          file.patch,
        );

        const enrichedComments: GithubReviewCommentDto[] = comments.map(
          (comment: AIReviewComment) => ({
            path: file.filename,
            line: comment.line,
            comment: `**[Code Defender Review]** ${comment.comment}`,
            commitId,
            severity: comment.severity,
          }),
        );

        allComments.push(...enrichedComments);
      } catch (error) {
        this.logger.error(`Failed to review ${file.filename}:`, error);
      }
    }

    return allComments;
  }
}
