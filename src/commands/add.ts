import { readdir, readFile, stat } from "node:fs/promises";

import { GIT_INDEX } from "../constants.js";
import { coloredLog } from "../functions/colored-log.js";
import { exists } from "../functions/exists.js";
import { isValidPath } from "../functions/is-valid-path.js";
import { BlobObject } from "../models/blob-object.js";
import { GitIndex } from "../models/git-index.js";
import { join } from "node:path";

const processPath = async (filePath: string, gitIndex: GitIndex): Promise<void> => {
  const stats = await stat(filePath);

  if (stats.isDirectory()) {
    if (filePath === '.git') {
      return;
    }
    const entries = await readdir(filePath);
    for (const entry of entries) {
      await processPath(join(filePath, entry), gitIndex);
    }
  } else if (stats.isFile()) {
    const content = await readFile(filePath);
    const blobObject = new BlobObject(content);
    const hash = await blobObject.dumpBlobObject();

    if (!gitIndex.checkDuplicate(filePath, hash)) {
      await gitIndex.pushEntry(filePath, hash);

      coloredLog({
        text: `added '${filePath}'`,
        color: 'green'
      })
    }
  }
}

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

  //ファイル名が条件を満たしていない場合の処理
  if (filePath !== '.' && !isValidPath(filePath)) {
    coloredLog({
      text: `fatal: invalid path '${filePath}'`,
      color: "red",
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

  const gitIndex = new GitIndex(GIT_INDEX);
  await gitIndex.initialize();

  await processPath(filePath, gitIndex);
  
  await gitIndex.dumpIndex();
};