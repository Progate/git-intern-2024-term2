import { readFileSync } from "node:fs";

import { coloredLog } from "../functions/colored-log.js";
import { BlobObject } from "../models/blob-object.js";

export const add = (options: Array<string>): void => {
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

  const content = readFileSync(filePath);

  const blobObject = new BlobObject();
  blobObject.setContent(content);
  blobObject.dumpBlobObject();
};
