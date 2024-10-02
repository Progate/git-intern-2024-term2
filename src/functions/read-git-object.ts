import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";

export const readGitObject = async (path: string): Promise<string> => {
  const file = Uint8Array.from(await readFile(path));

  return inflateSync(file).toString();
};
