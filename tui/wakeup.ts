import {isCancel ,select } from "@clack/prompts"
import chalk from "chalk"
import figlet from "figlet"
import { runCliMode } from "../modes/cli";
import { runTelegramMode } from "../modes/telegram";

const BANNER_FONT = 'ANSI Shadow'
const SHADOW = chalk.hex("#5b4d9e")
const FACE = chalk.hex("#e8dcf8").bold;

function printBannerWithShadow(ascii: string) {
  const lines = ascii.trimEnd().split("\n");
  const width = Math.max(...lines.map((line) => line.length));

  // Shadow
  for (const line of lines) {
    console.log(SHADOW(line.padEnd(width)));
  }

  // Move back up
  process.stdout.write(`\x1b[${lines.length}A`);

  // Face
  for (const line of lines) {
    console.log(FACE(line.padEnd(width)));
  }

  console.log();
}
export async function runWakeUp() {
  let ascii: string;
  try {
    ascii = figlet.textSync("your cli", {font:BANNER_FONT})
  } catch (error) {
    ascii = figlet.textSync("your cli", {font:"Standard"})
  }
  printBannerWithShadow(ascii);

  const mode = await select({
    message: "Which mode you want to proceed with?",
    options: [
      { value: "cli", label: "CLI" },
      { value: "telegram", label: "Telegram" },
      { value: "exit", label: "Exit" },
    ],
  });

  if (isCancel(mode) || mode ==="exit") { 
    console.log(chalk.red("Existing..."));
    return;
  }
  if (mode === "cli") {
    console.log(chalk.yellow("Starting cli mode"));
    await runCliMode();
  }
  else if (mode === "telegram") {
    await runTelegramMode()
  }
}