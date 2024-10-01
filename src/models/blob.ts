import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

import { GIT_OBJECTS } from "../constants.js";
import { coloredLog } from "../functions/colored-log.js";

export class Blob {
  content?: Buffer;

  public setContent = (content: Buffer): void => {
    this.content = content;
  };

  public dumpBlob = (): void => {
    if (!this.content) {
      coloredLog({
        text: "error in generating blob object.",
        color: "red",
      });
      return;
    }

    const store = `blob ${this.content.length.toString()}\x00${this.content.toString()}`;
    //16進数表示のため，hexに変換
    const hash = createHash("sha1").update(store).digest("hex");

    const dirPath = join(GIT_OBJECTS, hash.slice(0, 2));
    const filePath = join(GIT_OBJECTS, hash.slice(0, 2), hash.slice(2));
    const compressedBlob = deflateSync(new Uint8Array(Buffer.from(store)));

    if (existsSync(dirPath)) return;

    mkdirSync(dirPath);
    writeFileSync(filePath, new Uint8Array(compressedBlob));
  };
}
