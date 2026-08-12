#!/usr/bin/env bun
import { Command } from "commander";

import { initCommand } from "./commands/init";
import { loginCommand, logoutCommand } from "./commands/login";
import { serviceCommand } from "./commands/service";

const program = new Command();

program
    .name("rw")
    .description("CLI for the railway controller")
    .version("0.0.1");

program.addCommand(loginCommand());
program.addCommand(logoutCommand());
program.addCommand(initCommand());
program.addCommand(serviceCommand());

program.parseAsync().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
