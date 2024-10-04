import { COMMIT_OPTIONS, GIT_INDEX } from "../constants.js";
import { coloredLog } from "../functions/colored-log.js";
import { GitIndex } from "../models/git-index.js";
import { TreeObject } from "../models/tree-object.js";

export const commit = async (options: Array<string>): Promise<void> => {
  //ファイル名指定でコミットはできない仕様とする
  const option = options[0];
  const message = options[1];

  //optionもしくはmessageが存在しない場合
  if (!(option && message)) {
    coloredLog({
      text: "invalid command",
      color: "red",
    });
    return;
  }

  //optionがあらかじめ用意したものと一致しない場合
  if (!COMMIT_OPTIONS.some((OPTION) => OPTION.name === option)) {
    coloredLog({
      text: `error: unknown switch '${option}'\n`,
      color: "red",
    });
    console.log("Commit options:");
    COMMIT_OPTIONS.forEach((option) => {
      console.log(` ${option.name}   ${option.description}\n`);
    });
  }

  const gitIndex = new GitIndex(GIT_INDEX);
  await gitIndex.initialize();
  const fileData = gitIndex.getFileData();

  const treeObject = new TreeObject(fileData);
  const rootTreeHash = await treeObject.dumpAllTrees();

  //ファイルがステージングされていない場合
  if (!rootTreeHash) {
    console.log(
      'nothing added to commit but untracked files present (use "git add" to track)',
    );
    return;
  }

  console.log("rootTreeHash: ", rootTreeHash);
};
