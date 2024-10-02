import { readFile } from "node:fs/promises";

import { coloredLog } from "../functions/colored-log.js";
import { BlobObject } from "../models/blob-object.js";
import { GitIndex } from "../models/git-index.js";
import { GIT_INDEX } from "../constants.js";

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

  const content = await readFile(filePath);

  const blobObject = new BlobObject(content);
  const hash = await blobObject.dumpBlobObject();

  if(!hash) {
    console.log('Nothing has changed.')
    return;
  }

  const gitIndex = new GitIndex(GIT_INDEX);
  await gitIndex.initialize();
  await gitIndex.pushEntry(filePath, hash);
  await gitIndex.dumpIndex();

};
