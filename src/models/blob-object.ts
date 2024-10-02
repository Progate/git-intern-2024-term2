import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

import { generateObjectPath } from "../functions/generate-object-path.js";

export class BlobObject {
  constructor(private readonly content: Buffer) {}

  public dumpBlobObject = (): void => {
    const store = `blob ${this.content.length.toString()}\x00${this.content.toString()}`;
    //16進数表示のため，hexに変換
    const hash = createHash("sha1").update(store).digest("hex");

    const { dirPath, filePath } = generateObjectPath(hash);
    const compressedBlobObject = deflateSync(
      new Uint8Array(Buffer.from(store)),
    );

    if (existsSync(filePath)) return;

    if (!existsSync(dirPath)) mkdirSync(dirPath);

    writeFileSync(filePath, new Uint8Array(compressedBlobObject));
  };
}
