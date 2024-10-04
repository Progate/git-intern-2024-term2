import { readFile, writeFile } from "fs/promises";
import { join } from "path";

import { COMMIT_OPTIONS, GIT_DIR, GIT_HEAD, GIT_INDEX } from "../constants.js";
import { coloredLog } from "../functions/colored-log.js";
import { extractHeadHash } from "../functions/extract-head-hash.js";
import { Commit } from "../models/commit.js";
import { GitIndex } from "../models/git-index.js";
import { TreeObject } from "../models/tree-object.js";
import { add } from "./add.js";

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

  //optionが -amだった場合は全てのファイルをaddする
  if(option === '-am') {
    await add(['.'])
  }

  //indexからファイルパスとblobオブジェクトのhashを取得
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

  const parentHash = await extractHeadHash();

  //コミットに含める情報をセットしてdump
  const commit = new Commit();
  commit.setCommit({
    tree: rootTreeHash,
    parent: parentHash,
    author: "yamada taro",
    email: "yamada@gmail.com",
    message: message,
  });
  const commitHash = await commit.dumpCommit();

  //headを最新のコミットhashに更新しておく
  const headContent = await readFile(GIT_HEAD, "utf8");

  if (headContent.startsWith("ref: ")) {
    //今回の実装ではmainブランチのみの実装とする
    const branchPath = "main";

    const branchFilePath = join(GIT_DIR, "refs/heads", branchPath);
    await writeFile(branchFilePath, commitHash, "utf8");

    console.log(`Updated ${branchPath} branch with commit hash: ${commitHash}`);
  } else {
    await writeFile(GIT_HEAD, commitHash, "utf8");

    console.log(
      `Updated ${parentHash ?? ""} branch with commit hash: ${commitHash}`,
    );
  }
};
