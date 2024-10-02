import { stat } from "node:fs/promises";

import { exists } from "../functions/exists.js";

interface Entry {
  ctimeSec: string;
}

export class GitIndex {
  private Entries: Array<Entry>;

  constructor(private readonly gitIndexPath: string) {
    this.Entries = [];
  }

  public clearEntry = (): void => {
    this.Entries = [];
  };

  public pushEntry = async (filePath: string): Promise<void> => {
    await this.readEntries();

    const fileStat = await stat(filePath);

    console.log(fileStat);
  };

  public dumpIndex = (): void => {
    console.log(this.Entries);
  };

  private readEntries = async (): Promise<void> => {
    if (await exists(this.gitIndexPath)) return;

    console.log(this.gitIndexPath);
  };
}
