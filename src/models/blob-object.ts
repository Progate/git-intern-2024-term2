import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

import { GIT_OBJECTS } from "../constants.js";

export class BlobObject {
  constructor(private readonly content: Buffer) {}

  public dumpBlobObject = (): void => {
    const store = `blob ${this.content.length.toString()}\x00${this.content.toString()}`;
    //16進数表示のため，hexに変換
    const hash = createHash("sha1").update(store).digest("hex");

    const dirPath = join(GIT_OBJECTS, hash.slice(0, 2));
    const filePath = join(GIT_OBJECTS, hash.slice(0, 2), hash.slice(2));
    const compressedBlobObject = deflateSync(
      new Uint8Array(Buffer.from(store)),
    );

    if (existsSync(filePath)) return;

    if (!existsSync(dirPath)) mkdirSync(dirPath);

    writeFileSync(filePath, new Uint8Array(compressedBlobObject));
  };
}
