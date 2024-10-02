import { join } from "path";

export const CWD = process.cwd();

export const GIT_DIR = join(process.cwd(), ".git");
export const GIT_OBJECTS = join(GIT_DIR, "objects");
export const GIT_INDEX = join(GIT_DIR, "index");
