export const REVIEWABLE_FILE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.java',
  '.go',
  '.rs',
] as const;

export const EXCLUDED_FILE_PATTERNS = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.min.js',
  '.min.css',
  'dist/',
  'build/',
] as const;

export function isFileReviewable(filename: string): boolean {
  // Check if file has a reviewable extension
  const hasReviewableExtension = REVIEWABLE_FILE_EXTENSIONS.some((ext) =>
    filename.endsWith(ext),
  );

  // Check if file is in excluded patterns
  const isExcluded = EXCLUDED_FILE_PATTERNS.some((pattern) =>
    filename.includes(pattern),
  );

  return hasReviewableExtension && !isExcluded;
}
