import { access } from "node:fs/promises";

// https://github.com/privatenumber/fs.promises.exists/blob/develop/src/index.ts
export const exists = async (filePath: string): Promise<boolean> => {
  return await access(filePath).then(
    () => true,
    () => false,
  );
}