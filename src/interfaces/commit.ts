export interface Commit {
  hash: string;
  tree: string;
  parent?: string;
  author: string;
  committer: string;
  message: string;
}
