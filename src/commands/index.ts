import { log } from "./log.js";

export const validCommand = {
  log: log,
  help: () => {
    console.log("Available commands:");
    validCommandList.forEach((cmd) => {
      console.log(`  ${cmd}`);
    });
  },
};

export type ValidCommandType = keyof typeof validCommand;

export const validCommandList = Object.keys(
  validCommand,
) as Array<ValidCommandType>;
