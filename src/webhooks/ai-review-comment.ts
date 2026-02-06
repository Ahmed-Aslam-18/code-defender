export interface AIReviewComment {
  line: number;
  severity: 'low' | 'medium' | 'high';
  comment: string;
}
