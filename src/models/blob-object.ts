import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

import { generateObjectPath } from "../functions/generate-object-path.js";

export class BlobObject {
  constructor(private readonly content: Buffer) {}

  public dumpBlobObject = (): void => {
    const header = Buffer.from(`blob ${this.content.length.toString()}\x00`);
    const store = Buffer.concat([
      Uint8Array.from(header),
      Uint8Array.from(this.content),
    ]);

    //16進数表示のため，hexに変換
    const hash = createHash("sha1")
      .update(Uint8Array.from(store))
      .digest("hex");

    const { dirPath, filePath } = generateObjectPath(hash);
    const compressedBlobObject = deflateSync(Uint8Array.from(store));

    if (existsSync(filePath)) return;

    if (!existsSync(dirPath)) mkdirSync(dirPath);

    writeFileSync(filePath, Uint8Array.from(compressedBlobObject));
  };
}
