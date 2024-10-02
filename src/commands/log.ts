import { existsSync, readFileSync } from "node:fs";
import { join } from "path";

import { GIT_DIR } from "../constants.js";
import { coloredLog } from "../functions/colored-log.js";
import { Commit, CommitFieldType } from "../models/commit.js";

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

const getCommitHistory = (
  hash: string,
  history: Array<CommitFieldType> = [],
): Array<CommitFieldType> => {
  const commit = new Commit();
  commit.setCommit(hash);
  const commitData = commit.getCommit();

  const currentHistory = [...history, commitData];

  if (!commit.parent) {
    return currentHistory;
  }

  return getCommitHistory(commit.parent, currentHistory);
};

export const displayCommitHistory = (
  commitHistory: Array<CommitFieldType>,
): void => {
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

export const log = (_options?: Array<string>): void => {
  const headHash = extractHeadHash();

  if (!headHash) {
    console.log("there is no commit.");
    return;
  }

  const commitHistory = getCommitHistory(headHash);

  displayCommitHistory(commitHistory);
};
