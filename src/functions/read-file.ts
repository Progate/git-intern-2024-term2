import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

export const readFile = (path: string): string => {
  const file = new Uint8Array(readFileSync(path));

  return inflateSync(file).toString();
};
