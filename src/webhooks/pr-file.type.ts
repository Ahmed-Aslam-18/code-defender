export type PRFile = {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
  };

export type PRFiles = PRFile[];