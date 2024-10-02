import { join } from "node:path";

import { GIT_OBJECTS } from "../constants.js";

export const generateObjectPath = (
  hash: string,
): {
  dirPath: string;
  filePath: string;
} => {
  const dirPath = join(GIT_OBJECTS, hash.slice(0, 2));
  const filePath = join(GIT_OBJECTS, hash.slice(0, 2), hash.slice(2));
  return {
    dirPath,
    filePath,
  };
};
