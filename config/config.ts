import { homedir } from "node:os";

export const configPath = `${homedir()}/.cli-build/config.json`;

const config = await Bun.file(configPath).json();

export default config;
