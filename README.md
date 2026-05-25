# mdtoc

[![CI](https://github.com/00yhj22-debug/mdtoc/actions/workflows/ci.yml/badge.svg)](https://github.com/00yhj22-debug/mdtoc/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Generate a Markdown table of contents from a document's heading structure —
a small, dependency-free CLI and library written in TypeScript.

<!-- toc -->

- [mdtoc](#mdtoc)
  - [Why](#why)
  - [Install](#install)
  - [CLI usage](#cli-usage)
  - [Keeping a TOC in sync](#keeping-a-toc-in-sync)
  - [Library usage](#library-usage)
  - [Development](#development)
  - [License](#license)

<!-- /toc -->

## Why

A table of contents makes a long README navigable, but maintaining one by
hand is tedious and it drifts out of date the moment a heading changes.
`mdtoc` reads the headings, builds the list, and — with `--write` — keeps
it in sync between two HTML comment markers.

## Install

```bash
npm install
npm run build
```

> Not yet published to npm. Build from a clone; the compiled CLI lands at
> `dist/cli.js`.

## CLI usage

```bash
# Print a TOC for a file
node dist/cli.js README.md

# Only include h2–h3 headings
node dist/cli.js README.md --min 2 --max 3

# Rewrite the file in place (see below)
node dist/cli.js README.md --write

# Check that the TOC is up to date — exits 1 if it would change (CI friendly)
node dist/cli.js README.md --check
```

## Keeping a TOC in sync

Add a marker pair anywhere in the document:

```markdown
<!-- toc -->
<!-- /toc -->
```

Running `mdtoc <file> --write` replaces everything between the markers
with a fresh TOC. Headings inside fenced code blocks are ignored, and
anchor slugs follow GitHub's rules — including the `-1`, `-2` suffixes
used to disambiguate repeated headings.

## Library usage

```ts
import { generateToc, extractHeadings } from "mdtoc";

const markdown = "# Title\n## Section\n";

generateToc(markdown);
// "- [Title](#title)\n  - [Section](#section)"

extractHeadings(markdown);
// [{ level: 1, text: "Title", slug: "title" }, ...]
```

## Development

```bash
npm install
npm run build   # type-check and emit to dist/
npm test        # run the vitest suite
```

## License

[MIT](LICENSE)
