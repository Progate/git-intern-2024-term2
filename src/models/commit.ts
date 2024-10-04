import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

import { GIT_OBJECTS } from "../constants.js";
import { exists } from "../functions/exists.js";
import { generateObjectPath } from "../functions/path.js";
import { readGitObject } from "../functions/read-git-object.js";

export interface CommitFieldType {
  tree: string;
  parent?: string;
  author: string;
  email: string;
  hash: string;
  message: string;
}

export class Commit {
  tree: string;
  parent?: string;
  author: string;
  email: string;
  hash: string;
  message: string;

  constructor() {
    this.tree = "";
    this.author = "";
    this.message = "";
    this.email = "";
    this.hash = "";
  }

  public setCommitHash = async (hash: string): Promise<void> => {
    const content = await this.getCommitContent(hash);

    this.parseCommit(hash, content);
  };

  public setCommit = (commit: Omit<CommitFieldType, "hash">): void => {
    this.tree = commit.tree;
    this.author = commit.author;
    this.message = commit.message;
    this.email = commit.email;
    this.parent = commit.parent;
  };

  public getCommit = (): CommitFieldType => {
    return {
      tree: this.tree,
      author: this.author,
      message: this.message,
      email: this.email,
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
        case "author": {
          const authorRegex = /^(.*?)\s+<([^>]+)>\s+(\d+\s+[+-]\d{4})$/;
          const authorMatch = authorRegex.exec(value);
          if (authorMatch) {
            this.author = authorMatch[1] ? authorMatch[1].trim() : "";
            this.email = authorMatch[2] ?? "";
          } else {
            this.author = value; // Keep the original format if parsing fails
          }
          break;
        }
      }
    }
  };

  private formatCommitContent(): string {
    let commitContent = `tree ${this.tree}\n`;

    if (this.parent) {
      commitContent += `parent ${this.parent}\n`;
    }

    commitContent += `author ${this.author} ${this.email} ${Math.floor(Date.now() / 1000).toString()} +0900\n\n`;
    commitContent += this.message;

    return commitContent;
  }

  // Method to dump the commit object to the .git/objects directory
  public async dumpCommit(): Promise<string> {
    const content = this.formatCommitContent();

    // Create the buffer for the commit object
    const contentBuffer = Buffer.from(content);
    const headerBuffer = Buffer.from(
      `commit ${contentBuffer.length.toString()}\0`,
    );
    const commitBuffer = Buffer.concat([
      Uint8Array.from(headerBuffer),
      Uint8Array.from(contentBuffer),
    ]);

    // Create the SHA-1 hash of the commit object
    const commitHash = createHash("sha1")
      .update(Uint8Array.from(commitBuffer))
      .digest("hex");

    // Generate the object path and write the compressed content
    const { dirPath, filePath } = generateObjectPath(commitHash);

    if (!(await exists(dirPath))) {
      await mkdir(dirPath, { recursive: true });
    }

    const compressedContent = deflateSync(Uint8Array.from(commitBuffer));
    await writeFile(filePath, Uint8Array.from(compressedContent));

    return commitHash;
  }
}
