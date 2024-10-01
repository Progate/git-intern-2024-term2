import { existsSync, readFileSync } from "node:fs";
import { join } from "path";

import { GIT_DIR, GIT_OBJECTS } from "../constants.js";
import { coloredLog } from "../functions/colored-log.js";
import { readFile } from "../functions/read-file.js";
import { Commit } from "../interfaces/commit.js";

const extractHeadHash = (): string | undefined => {
  const headPath = join(GIT_DIR, "HEAD");

  if (!existsSync(headPath)) {
    return;
  }

  const headText = readFileSync(headPath).toString("utf-8");

  const refPrefix = "ref: ";
  //ブランチ名かコミットハッシュのどちらをHEADに持つかを識別して出し分ける
  if (headText.startsWith(refPrefix)) {
    return readFileSync(
      join(GIT_DIR, headText.slice(refPrefix.length)).trim(),
      "utf-8",
    ).trim();
  } else {
    return headText.trim();
  }
};

const getCommitContent = (hash: string): string => {
  const dirName = hash.slice(0, 2);
  const fileName = hash.slice(2);

  const path = join(GIT_OBJECTS, dirName, fileName);

  return readFile(path);
};

const parseCommit = (hash: string, content: string): Commit => {
  const lines = content.trim().split("\n");
  const commit: Partial<Commit> = { hash };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "") {
      commit.message = lines
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
        commit.tree = value;
        break;
      case "parent":
        commit.parent = value;
        break;
      case "author":
        commit.author = value;
        break;
      case "committer":
        commit.committer = value;
        break;
    }
  }

  return commit as Commit;
};

const getCommitHistory = (
  hash: string,
  history: Array<Commit> = [],
): Array<Commit> => {
  const content = getCommitContent(hash);
  const commit = parseCommit(hash, content);

  const currentHistory = [...history, commit];

  if (!commit.parent) {
    return currentHistory;
  }

  return getCommitHistory(commit.parent, currentHistory);
};

export const displayCommitHistory = (commitHistory: Array<Commit>): void => {
  commitHistory.forEach((commit) => {
    coloredLog({
      text: `commit: ${commit.hash}`,
      color: "yellow",
    });
    console.log(`Author: ${commit.author}`);
    console.log(`Committer: ${commit.committer}\n`);
    console.log(`  ${commit.message}\n`);
  });
};

export const log = (): void => {
  const headHash = extractHeadHash();

  if (!headHash) {
    console.log("there is no commit.");
    return;
  }

  const commitHistory = getCommitHistory(headHash);

  displayCommitHistory(commitHistory);
};
