import { createHash } from "node:crypto";
import { stat, writeFile } from "node:fs/promises";

import { GIT_INDEX } from "../constants.js";
import { exists } from "../functions/exists.js";

interface Entry {
  cTimeSec: number;
  cTimeNanoSec: number;
  mTimeSec: number;
  mTimeNanoSec: number;
  device: number;
  inode: number;
  mode: number;
  uId: number;
  gId: number;
  size: number;
  hash: string;
  flag: boolean;
  length: number;
  filePath: string;
}

export class GitIndex {
  private entries: Array<Entry>;
  private readonly VERSION = 2;

  constructor(private readonly gitIndexPath: string) {
    this.entries = [];
  }

  public initialize = async (): Promise<void> => {
    await this.parseEntries();
  };

  public clearEntry = (): void => {
    this.entries = [];
  };

  public pushEntry = async (filePath: string, hash: string): Promise<void> => {
    const fileStat = await stat(filePath);

    // https://nodejs.org/api/fs.html#class-fsstats
    const entry: Entry = {
      cTimeSec: fileStat.ctime.getTime(),
      cTimeNanoSec: fileStat.ctimeMs,
      mTimeSec: fileStat.mtime.getTime(),
      mTimeNanoSec: fileStat.mtimeMs,
      device: fileStat.dev,
      inode: fileStat.ino,
      mode: fileStat.mode,
      uId: fileStat.uid,
      gId: fileStat.gid,
      size: fileStat.size,
      hash: hash,
      flag: false,
      length: filePath.length,
      filePath: filePath,
    };

    this.entries.push(entry);
  };

  public dumpIndex = async (): Promise<void> => {
    const headerBuffer = this.createHeaderBuffer();
    const entriesBuffer = this.createEntriesBuffer();
    const checkSumBuffer = this.createCheckSumBuffer(entriesBuffer);

    const indexBuffer = Buffer.concat([
      Uint8Array.from(headerBuffer),
      Uint8Array.from(entriesBuffer),
      Uint8Array.from(checkSumBuffer),
    ]);

    await writeFile(GIT_INDEX, Uint8Array.from(indexBuffer));
  };

  private parseEntries = async (): Promise<void> => {
    if (await exists(this.gitIndexPath)) return;

    console.log(this.gitIndexPath);
  };

  private createCheckSumBuffer = (entriesBuffer: Buffer): Buffer => {
    const hash = createHash("sha1")
      .update(Uint8Array.from(entriesBuffer))
      .digest("hex");
    return Buffer.from(hash);
  };

  private createHeaderBuffer = (): Buffer => {
    const headerBuffer = Buffer.alloc(12);
    // https://www.w3schools.com/nodejs/met_buffer_write.asp
    headerBuffer.write("DIRC", 0, 2);
    headerBuffer.writeUInt32BE(2, 4);
    headerBuffer.writeUInt32BE(this.entries.length, 8);
    return headerBuffer;
  };

  private createEntriesBuffer = (): Buffer => {
    const buffers: Array<Buffer> = [];

    for (const entry of this.entries) {
      const entryBuffer = this.createEntryBuffer(entry);
      buffers.push(entryBuffer);
    }

    return Buffer.concat([Uint8Array.from(buffers)]);
  };

  private createEntryBuffer = (entry: Entry): Buffer => {
    let entryBufferLength = 64 + entry.length;
    entryBufferLength += 8 - (entryBufferLength % 8);

    const entryBuffer = Buffer.alloc(entryBufferLength);
    let offset = 0;

    offset = this.writeUInt32BE(entryBuffer, entry.cTimeSec, offset);
    offset = this.writeUInt32BE(entryBuffer, entry.cTimeNanoSec, offset);
    offset = this.writeUInt32BE(entryBuffer, entry.mTimeSec, offset);
    offset = this.writeUInt32BE(entryBuffer, entry.mTimeNanoSec, offset);
    offset = this.writeUInt32BE(entryBuffer, entry.device, offset);
    offset = this.writeUInt32BE(entryBuffer, entry.inode, offset);
    offset = this.writeUInt32BE(entryBuffer, entry.mode, offset);
    offset = this.writeUInt32BE(entryBuffer, entry.uId, offset);
    offset = this.writeUInt32BE(entryBuffer, entry.gId, offset);
    offset = this.writeUInt32BE(entryBuffer, entry.size, offset);

    Buffer.from(entry.hash, "hex").copy(Uint8Array.from(entryBuffer), offset);
    offset += 20;

    // 今回の実装範囲でflagの内容を読む・作成する必要はないと判断したため，全て0とする
    // https://learn.microsoft.com/ja-jp/archive/msdn-magazine/2017/august/devops-git-internals-architecture-and-index-files#%E3%82%A4%E3%83%B3%E3%83%87%E3%83%83%E3%82%AF%E3%82%B9%E3%81%AE%E3%81%97%E3%81%8F%E3%81%BF
    offset += 2;

    entryBuffer.writeUInt16BE(entry.length, offset);
    offset += 2;

    Buffer.from(entry.filePath).copy(Uint8Array.from(entryBuffer), offset);

    return entryBuffer;
  };

  private writeUInt32BE = (
    buffer: Buffer,
    value: number,
    offset: number,
  ): number => {
    buffer.writeUInt32BE(value, offset);
    return offset + 4;
  };
}
