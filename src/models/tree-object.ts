import { createHash } from "crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "zlib";

import { exists } from "../functions/exists.js";
import { generateObjectPath } from "../functions/path.js";

interface TreeEntry {
  mode: string;
  hash: string;
  name: string;
  type: "blob" | "tree";
}

interface FileSystem {
  [key: string]: FileSystem | { hash: string };
}

interface FileData {
  filePath: string;
  hash: string;
}

export class TreeObject {
  private fileSystem: FileSystem = {};
  private treeObjects = new Map<string, Array<TreeEntry>>();

  constructor(fileData: Array<FileData>) {
    this.buildFileSystem(fileData);
    this.createTreeObjects();
  }

  //ファイルパスとハッシュからファイル構造を構築
  private buildFileSystem(fileData: Array<FileData>): void {
    fileData.forEach(({ filePath, hash }) => {
      const parts = filePath.split("/");
      let current = this.fileSystem;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = { hash };
        } else {
          if (!(part in current)) {
            current[part] = {};
          }
          current = current[part] as FileSystem;
        }
      });
    });
  }

  private createTreeObjects(): void {
    this.createTreeObjectsRecursive("", this.fileSystem);
  }

  private createTreeObjectsRecursive(path: string, node: FileSystem): string {
    const entries: Array<TreeEntry> = [];

    for (const [name, value] of Object.entries(node)) {
      if ("hash" in value) {
        entries.push({
          mode: "100644",
          hash: String(value.hash),
          name,
          type: "blob",
        });
      } else {
        const subPath = path ? `${path}/${name}` : name;
        const hash = this.createTreeObjectsRecursive(subPath, value);
        entries.push({
          mode: "040000",
          hash,
          name,
          type: "tree",
        });
      }
    }

    //一意なtreeオブジェクトを生成するためにentryを名前順にsortしておく
    const sortedEntries = entries.sort((a, b) => a.name.localeCompare(b.name));

    const treeHash = this.createTreeHash(sortedEntries);
    this.treeObjects.set(path, sortedEntries);

    return treeHash;
  }

  private createTreeHash(entries: Array<TreeEntry>): string {
    const buffers: Array<Buffer> = [];

    for (const entry of entries) {
      buffers.push(
        Buffer.from(`${entry.mode} ${entry.name}\0`),
        Buffer.from(entry.hash, "hex"),
      );
    }

    const contentBuffer = Buffer.concat(
      buffers.map((buffer) => Uint8Array.from(buffer)),
    );
    const headerBuffer = Buffer.from(
      `tree ${contentBuffer.length.toString()}\0`,
    );
    const treeBuffer = Buffer.concat([
      Uint8Array.from(headerBuffer),
      Uint8Array.from(contentBuffer),
    ]);

    return createHash("sha1").update(Uint8Array.from(treeBuffer)).digest("hex");
  }

  private getTreeObject(path: string): Array<TreeEntry> | undefined {
    return this.treeObjects.get(path);
  }

  private async dumpTree(path = ""): Promise<string | undefined> {
    const entries = this.getTreeObject(path);
    if (!entries) return;

    const buffers: Array<Buffer> = [];

    for (const entry of entries) {
      buffers.push(
        Buffer.from(`${entry.mode} ${entry.name}\0`),
        Buffer.from(entry.hash, "hex"),
      );
    }

    const contentBuffer = Buffer.concat(
      buffers.map((buffer) => Uint8Array.from(buffer)),
    );
    const headerBuffer = Buffer.from(
      `tree ${contentBuffer.length.toString()}\0`,
    );
    const treeBuffer = Buffer.concat([
      Uint8Array.from(headerBuffer),
      Uint8Array.from(contentBuffer),
    ]);

    const treeHash = createHash("sha1")
      .update(Uint8Array.from(treeBuffer))
      .digest("hex");

    const { dirPath, filePath } = generateObjectPath(treeHash);

    if (!(await exists(dirPath))) await mkdir(dirPath, { recursive: true });

    const compressedContent = deflateSync(Uint8Array.from(treeBuffer));
    await writeFile(filePath, Uint8Array.from(compressedContent));

    if (path === "") return treeHash;
  }

  public async dumpAllTrees(path = ""): Promise<string | undefined> {
    const entries = this.getTreeObject(path);
    if (!entries || entries.length === 0) return;

    const hash = await this.dumpTree(path);

    for (const entry of entries) {
      if (entry.type === "tree") {
        const subPath = path ? `${path}/${entry.name}` : entry.name;
        await this.dumpAllTrees(subPath);
      }
    }

    return hash;
  }
}
