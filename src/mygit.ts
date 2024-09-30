import { displayGitLog } from "./commands/log.js";

export const mygit = async (argv: Array<string>): Promise<void> => {
  const command = argv[2];

  if (!command) {
    //TODO: コマンド一覧を表示する
    console.log("command list");
    return;
  }

  switch (command) {
    case "log":
      displayGitLog();
      break;
    default:
      console.log(`mygit: '${command}' is not a mygit command.`);
      break;
  }

  // Avoid eslint error by adding some async operation.
  await new Promise((resolve) => setTimeout(resolve, 1000));
};
