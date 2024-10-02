import { readFile } from "node:fs/promises";

import { coloredLog } from "../functions/colored-log.js";
import { BlobObject } from "../models/blob-object.js";

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
  await blobObject.dumpBlobObject();
};
