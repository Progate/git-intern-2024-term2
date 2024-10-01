import { stat } from "fs"

export class Index {
  sigunature = "DIRC"
  // バージョンによってエントリ形式が異なるため、ひとまず2で固定
  version = 2
  entries: Array<Entry>

  constructor() {
    this.entries = []
  }

  addEntry(entry: Entry): void {
    this.entries.push(entry)
  }
}

export class Entry {
  constructor(file: File) {
    // TODO: https://zenn.dev/hirokihello/articles/522183114dac569dbe80
    const statInfo = await stat(file.path)
  }
}
