import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";

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
  length: number;
  filePath: string;
}

export class GitIndex {
  private entries: Array<Entry>;
  private readonly VERSION = 2;
  private readonly SIGNATURE = "DIRC";

  constructor(private readonly gitIndexPath: string) {
    this.entries = [];
  }

  public initialize = async (): Promise<void> => {
    await this.parseEntries();
  };

  public clearEntry = (): void => {
    this.entries = [];
  };

  public getFilePaths = (): Array<string> => {
    return this.entries.map((entry) => entry.filePath);
  };

  public checkDuplicate = (filePath: string, hash: string): boolean => {
    return this.entries.some(
      (entry) => entry.filePath === filePath && entry.hash === hash,
    );
  };

  private deleteDuplicate = (filePath: string): void => {
    const index = this.entries.findIndex(
      (entry) => entry.filePath === filePath,
    );
    if (index !== -1) this.entries.splice(index, 1);
  };

  public pushEntry = async (filePath: string, hash: string): Promise<void> => {
    const fileStat = await stat(filePath);

    //同じファイルパスのentryは重複を防ぐために削除しておく
    this.deleteDuplicate(filePath);

    // https://nodejs.org/api/fs.html#class-fsstats
    const entry: Entry = {
      cTimeSec: Math.floor(fileStat.ctime.getTime() / 1000),
      cTimeNanoSec: (fileStat.ctime.getTime() % 1000) * 1e6,
      mTimeSec: Math.floor(fileStat.mtime.getTime() / 1000),
      mTimeNanoSec: (fileStat.mtime.getTime() % 1000) * 1e6,
      device: fileStat.dev,
      inode: fileStat.ino,
      mode: fileStat.mode,
      uId: fileStat.uid,
      gId: fileStat.gid,
      size: fileStat.size,
      hash: hash,
      length: filePath.length,
      filePath: filePath,
    };

    this.entries.push(entry);
  };

  public dumpIndex = async (): Promise<Array<string>> => {
    const headerBuffer = this.createHeaderBuffer();
    const entriesBuffer = this.createEntriesBuffer();
    const checkSumBuffer = this.createCheckSumBuffer(
      headerBuffer,
      entriesBuffer,
    );

    const indexBuffer = Buffer.concat([
      Uint8Array.from(headerBuffer),
      Uint8Array.from(entriesBuffer),
      Uint8Array.from(checkSumBuffer),
    ]);

    await writeFile(this.gitIndexPath, Uint8Array.from(indexBuffer));

    return this.entries.map((entry) => entry.filePath);
  };

  private parseEntries = async (): Promise<void> => {
    if (!(await exists(this.gitIndexPath))) return;

    const buffer = await readFile(this.gitIndexPath);
    const entryCount = buffer.readUInt32BE(8);

    let offset = 12;
    for (let i = 0; i < entryCount; i++) {
      const entry = this.parseEntry(buffer, offset);

      const currentOffset = offset + 62 + entry.length;
      offset = currentOffset + 8 - ((currentOffset - 12) % 8);

      this.entries.push(entry);
    }
  };

  private parseEntry = (buffer: Buffer, offset: number): Entry => {
    const entry: Entry = {
      cTimeSec: buffer.readUInt32BE(offset),
      cTimeNanoSec: buffer.readUInt32BE(offset + 4),
      mTimeSec: buffer.readUInt32BE(offset + 8),
      mTimeNanoSec: buffer.readUInt32BE(offset + 12),
      device: buffer.readUInt32BE(offset + 16),
      inode: buffer.readUInt32BE(offset + 20),
      mode: buffer.readUInt32BE(offset + 24),
      uId: buffer.readUInt32BE(offset + 28),
      gId: buffer.readUInt32BE(offset + 32),
      size: buffer.readUInt32BE(offset + 36),
      hash: buffer.subarray(offset + 40, offset + 60).toString("hex"),
      length: buffer.readUInt16BE(offset + 60),
      filePath: buffer
        .subarray(offset + 62, offset + 62 + buffer.readUInt16BE(offset + 60))
        .toString("utf8"),
    };

    return entry;
  };

  private createCheckSumBuffer = (
    headerBuffer: Buffer,
    entriesBuffer: Buffer,
  ): Buffer => {
    const hash = createHash("sha1")
      .update(
        Uint8Array.from(
          Buffer.concat([
            Uint8Array.from(headerBuffer),
            Uint8Array.from(entriesBuffer),
          ]),
        ),
      )
      .digest("hex");

    //明示的にencodingを指定しないとデフォルトでutf-8になってしまう
    // https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding
    return Buffer.from(hash, "hex");
  };

  private createHeaderBuffer = (): Buffer => {
    const headerBuffer = Buffer.alloc(12);
    // https://www.w3schools.com/nodejs/met_buffer_write.asp
    headerBuffer.write(this.SIGNATURE, 0, 4);
    headerBuffer.writeUInt32BE(this.VERSION, 4);
    headerBuffer.writeUInt32BE(this.entries.length, 8);

    return headerBuffer;
  };

  private createEntriesBuffer = (): Buffer => {
    const buffers: Array<Buffer> = [];

    for (const entry of this.entries) {
      const entryBuffer = this.createEntryBuffer(entry);
      buffers.push(entryBuffer);
    }

    return Buffer.concat(buffers.map((buffer) => Uint8Array.from(buffer)));
  };

  private createEntryBuffer = (entry: Entry): Buffer => {
    let entryBufferLength = 62 + entry.length;
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

    entryBuffer.write(entry.hash, offset, 20, "hex");
    offset += 20;

    // 今回の実装範囲でflagの内容を読む・作成する必要はないと判断したため，特に操作は行わない
    // https://learn.microsoft.com/ja-jp/archive/msdn-magazine/2017/august/devops-git-internals-architecture-and-index-files#%E3%82%A4%E3%83%B3%E3%83%87%E3%83%83%E3%82%AF%E3%82%B9%E3%81%AE%E3%81%97%E3%81%8F%E3%81%BF
    entryBuffer.writeUInt16BE(entry.length, offset);
    offset += 2;

    entryBuffer.write(entry.filePath, offset, entry.length);

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
