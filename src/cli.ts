#!/usr/bin/env node
/** Command-line interface for mdtoc. */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { generateToc, updateToc, type TocOptions } from "./index.js";

const VERSION = "0.1.0";

const HELP = `mdtoc — generate a Markdown table of contents

Usage:
  mdtoc <file> [options]

Options:
  -w, --write       update the file in place between <!-- toc --> markers
      --min <n>     lowest heading level to include (default: 1)
      --max <n>     highest heading level to include (default: 6)
  -h, --help        show this help and exit
  -v, --version     show the version and exit
`;

interface ParsedArgs {
  file: string | undefined;
  write: boolean;
  options: TocOptions;
}

function parseLevel(flag: string, raw: string | undefined): number {
  const value = Number(raw);
  if (raw === undefined || !Number.isInteger(value) || value < 1 || value > 6) {
    throw new Error(`${flag} expects an integer between 1 and 6`);
  }
  return value;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { file: undefined, write: false, options: {} };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    switch (arg) {
      case "-w":
      case "--write":
        parsed.write = true;
        break;
      case "--min":
        parsed.options.minLevel = parseLevel("--min", argv[++i]);
        break;
      case "--max":
        parsed.options.maxLevel = parseLevel("--max", argv[++i]);
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`unknown option: ${arg}`);
        }
        if (parsed.file !== undefined) {
          throw new Error(`unexpected extra argument: ${arg}`);
        }
        parsed.file = arg;
    }
  }

  return parsed;
}

/**
 * Run the CLI with the given arguments (everything after `node mdtoc`).
 * Returns a process exit code: `0` ok, `1` runtime error, `2` bad usage.
 */
export function main(argv: string[]): number {
  if (argv.includes("-h") || argv.includes("--help")) {
    process.stdout.write(HELP);
    return 0;
  }
  if (argv.includes("-v") || argv.includes("--version")) {
    process.stdout.write(`mdtoc ${VERSION}\n`);
    return 0;
  }

  let args: ParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`mdtoc: ${(error as Error).message}\n`);
    return 2;
  }

  if (args.file === undefined) {
    process.stderr.write("mdtoc: missing input file\n");
    return 2;
  }

  let markdown: string;
  try {
    markdown = readFileSync(args.file, "utf8");
  } catch {
    process.stderr.write(`mdtoc: cannot read file: ${args.file}\n`);
    return 2;
  }

  if (args.write) {
    let updated: string;
    try {
      updated = updateToc(markdown, args.options);
    } catch (error) {
      process.stderr.write(`mdtoc: ${(error as Error).message}\n`);
      return 1;
    }
    writeFileSync(args.file, updated, "utf8");
    process.stdout.write(`mdtoc: updated ${args.file}\n`);
    return 0;
  }

  const toc = generateToc(markdown, args.options);
  process.stdout.write(toc.length > 0 ? `${toc}\n` : "");
  return 0;
}

/* istanbul ignore next: only runs when invoked directly, not under test */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
