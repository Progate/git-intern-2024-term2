import { stat } from "node:fs/promises";
import { exists } from "../functions/exists.js";

interface Entry {
  cTimeSec: number;
  cTimeNanoSec: number;
  mTimeSec: number;
  mTimeNanoSec: number;
  device: number,
  inode: number,
  mode: number,
  uId: number,
  gId: number,
  size: number,
  hash: string,
  flag: boolean,
  length: number,
  filePath: string,
}

export class GitIndex {
  private entries: Array<Entry>;

  constructor(private readonly gitIndexPath: string) {
    this.entries = [];
  }
  
  public initialize = async (): Promise<void> => {
    await this.readEntries();
  }

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

    this.entries.push(entry)
  };

  private createEntriesBuffer = (): Buffer => {
    const buffers: Array<Buffer> = [];
  
    for (const entry of this.entries) {
      const entryBuffer = this.createEntryBuffer(entry);
      buffers.push(entryBuffer);
    }
  
    return Buffer.concat([Uint8Array.from(buffers)]);
  }
  
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

    offset += 2;
  
    entryBuffer.writeUInt16BE(entry.length, offset);
    offset += 2;
  
    Buffer.from(entry.filePath).copy(Uint8Array.from(entryBuffer), offset);
  
    return entryBuffer;
  }
  
  private writeUInt32BE = (buffer: Buffer, value: number, offset: number): number => {
    buffer.writeUInt32BE(value, offset);
    return offset + 4;
  }
  

  public dumpIndex = (): void => {

    const headerBuffer = '';
    const entriesBuffer = this.createEntriesBuffer()

    console.log(this.entries);
  };

  private parseEntries = async (): Promise<void> => {
    if (await exists(this.gitIndexPath)) return;

    console.log(this.gitIndexPath);
  };
}
