export interface GithubReviewCommentDto {
  path: string;
  line: number;
  comment: string;
  commitId: string;
  severity?: 'low' | 'medium' | 'high';
}
