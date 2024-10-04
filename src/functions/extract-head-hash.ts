import { readFile } from "fs/promises";
import { join } from "path";

import { GIT_DIR } from "../constants.js";
import { exists } from "./exists.js";

export const extractHeadHash = async (): Promise<string | undefined> => {
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
    const branchPath = join(GIT_DIR, headText.slice(refPrefix.length)).trim();
    if (!(await exists(branchPath))) return;
    return await readFile(branchPath, "utf-8").then((path) => path.trim());
  } else {
    return headText.trim();
  }
};
