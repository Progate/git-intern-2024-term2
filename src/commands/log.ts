import { coloredLog } from "../functions/colored-log.js";
import { extractHeadHash } from "../functions/extract-head-hash.js";
import { Commit, CommitFieldType } from "../models/commit.js";

const getCommitHistory = async (
  hash: string,
  history: Array<CommitFieldType> = [],
): Promise<Array<CommitFieldType>> => {
  const commit = new Commit();
  await commit.setCommitHash(hash);
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
    console.log(`author: ${commit.author}\n`);
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
