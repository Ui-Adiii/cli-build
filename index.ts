#!/usr/bin/env bun
import { Command } from "commander";
import { runWakeUp } from "./tui/wakeup";
import { configPath } from "./config/config";

const program = new Command();

program
  .name("cli-build")
  .description("A simple CLI tool built with Bun and TypeScript")
  .version("0.0.1");

program
  .command("wakeup")
  .description("show the banner and pick cli or telegram mode")
  .action(async () => {
    await runWakeUp();
  });


  
// config
const config = program
  .command("config")
  .description("Manage CLI configuration");

config
  .command("set <key> <value>")
  .description("Set a configuration value")
  .action(async (key, value) => {
    const configDir = `${process.env.USERPROFILE}/.cli-build`;
    const configPath = `${configDir}/config.json`;

    await Bun.$`mkdir -p ${configDir}`;

    const file = Bun.file(configPath);

    let data: Record<string, string> = {};

    if (await file.exists()) {
      data = await file.json();
    }

    data[key] = value;

    await Bun.write(configPath, JSON.stringify(data, null, 2));

    console.log(`✓ ${key} saved`);
  });
config
  .command("get <key>")
  .description("Get a configuration value")
  .action(async (key) => {
    const file = Bun.file(configPath);

    if (!(await file.exists())) {
      console.log("No configuration found.");
      return;
    }

    const data = await file.json();

    if (!(key in data)) {
      console.log(`${key} is not configured.`);
      return;
    }

    // Don't expose the API key
    if (key === "nvidia-api-key") {
      console.log("nvidia-api-key: ********");
      return;
    }

    console.log(data[key]);
  });

await program.parseAsync(process.argv);
