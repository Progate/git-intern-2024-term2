import { readFile } from "node:fs/promises";

import { GIT_INDEX } from "../constants.js";
import { coloredLog } from "../functions/colored-log.js";
import { exists } from "../functions/exists.js";
import { BlobObject } from "../models/blob-object.js";
import { GitIndex } from "../models/git-index.js";

export const add = async (options: Array<string>): Promise<void> => {
  const filePath = options[0];

  //引数にファイルパスが含まれていなかった場合の処理
  if (!filePath) {
    console.log("Nothing specified, nothing added.");
    coloredLog({
      text: "hint: Maybe you wanted to say 'git add XXX'?",
      color: "yellow",
    });
    return;
  }

  //ファイルが存在しなかった場合の処理
  if (!(await exists(filePath))) {
    coloredLog({
      text: `fatal: pathspec '${filePath}' did not match any files`,
      color: "red",
    });
    return;
  }

  // TODO: ディレクトリを指定した際などに複数回pushEntryする
  const content = await readFile(filePath);

  const blobObject = new BlobObject(content);
  const hash = await blobObject.dumpBlobObject();

  if (!hash) {
    console.log("Nothing has changed.");
    return;
  }

  const gitIndex = new GitIndex(GIT_INDEX);
  await gitIndex.initialize();
  await gitIndex.pushEntry(filePath, hash);
  await gitIndex.dumpIndex();
};
