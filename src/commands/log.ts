import { readFile } from "node:fs/promises";
import { join } from "path";

import { GIT_DIR } from "../constants.js";
import { coloredLog } from "../functions/colored-log.js";
import { exists } from "../functions/exists.js";
import { Commit, CommitFieldType } from "../models/commit.js";

const extractHeadHash = async (): Promise<string | undefined> => {
  const headPath = join(GIT_DIR, "HEAD");

  if (!(await exists(headPath))) {
    return;
  }

  const headText = await readFile(headPath).then((head) =>
    head.toString("utf-8"),
  );

  const refPrefix = "ref: ";
  //ブランチ名かコミットハッシュのどちらをHEADに持つかを識別して出し分ける
  if (headText.startsWith(refPrefix)) {
    return await readFile(
      join(GIT_DIR, headText.slice(refPrefix.length)).trim(),
      "utf-8",
    ).then((path) => path.trim());
  } else {
    return headText.trim();
  }
};

const getCommitHistory = async (
  hash: string,
  history: Array<CommitFieldType> = [],
): Promise<Array<CommitFieldType>> => {
  const commit = new Commit();
  await commit.setCommit(hash);
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

export const log = async (_options?: Array<string>): Promise<void> => {
  const headHash = await extractHeadHash();

  if (!headHash) {
    console.log("there is no commit.");
    return;
  }

  const commitHistory = await getCommitHistory(headHash);

  displayCommitHistory(commitHistory);
};
