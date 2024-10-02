import { join } from "node:path";

import { GIT_OBJECTS } from "../constants.js";
import { readGitObject } from "../functions/read-git-object.js";

export interface CommitFieldType {
  tree: string;
  parent?: string;
  author: string;
  committer: string;
  hash: string;
  message: string;
}

export class Commit {
  tree: string;
  parent?: string;
  author: string;
  committer: string;
  hash: string;
  message: string;

  constructor() {
    this.tree = "";
    this.author = "";
    this.message = "";
    this.committer = "";
    this.hash = "";
  }

  public setCommit = async (hash: string): Promise<void> => {
    const content = await this.getCommitContent(hash);

    this.parseCommit(hash, content);
  };

  public getCommit = (): CommitFieldType => {
    return {
      tree: this.tree,
      author: this.author,
      message: this.message,
      committer: this.committer,
      hash: this.hash,
    };
  };

  private getCommitContent = async (hash: string): Promise<string> => {
    const dirName = hash.slice(0, 2);
    const fileName = hash.slice(2);

    const path = join(GIT_OBJECTS, dirName, fileName);

    return await readGitObject(path);
  };

  private parseCommit = (hash: string, content: string): void => {
    const lines = content.trim().split("\n");
    this.hash = hash;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === "") {
        this.message = lines
          .slice(i + 1)
          .join("\n")
          .trim();
        break;
      }

      if (!line) {
        break;
      }

      const [key, ...rest] = line.split(" ");
      const value = rest.join(" ");

      switch (key) {
        //TODO: logとして表示しない情報も，持っておく．最終的に必要なければ消す．
        case "tree":
          this.tree = value;
          break;
        case "parent":
          this.parent = value;
          break;
        case "author":
          this.author = value;
          break;
        case "committer":
          this.committer = value;
          break;
      }
    }
  };
}
