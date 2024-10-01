import { type ValidCommandType, validCommand } from "./commands/index.js";

export const mygit = async (argv: Array<string>): Promise<void> => {
  const command = argv[2];

  if (!command) {
    //TODO: コマンド一覧を表示する
    validCommand.help();
    return;
  }

  const runCommand =
    command in validCommand
      ? validCommand[command as ValidCommandType]
      : undefined;

  if (runCommand) {
    runCommand();
  } else {
    console.log(`mygit: '${command}' is not a valid mygit command.\n`);
    validCommand.help();
  }

  // Avoid eslint error by adding some async operation.
  await new Promise((resolve) => setTimeout(resolve, 1000));
};
