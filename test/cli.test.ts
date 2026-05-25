import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { main } from "../src/cli.js";

let workdir: string;

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), "mdtoc-test-"));
});

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true });
});

function writeDoc(name: string, content: string): string {
  const path = join(workdir, name);
  writeFileSync(path, content, "utf8");
  return path;
}

describe("cli", () => {
  it("returns 0 and prints a TOC for a valid file", () => {
    const path = writeDoc("doc.md", "# Title\n## Section\n");
    expect(main([path])).toBe(0);
  });

  it("returns 2 when no file is given", () => {
    expect(main([])).toBe(2);
  });

  it("returns 2 when the file cannot be read", () => {
    expect(main([join(workdir, "missing.md")])).toBe(2);
  });

  it("returns 2 for an unknown option", () => {
    const path = writeDoc("doc.md", "# Title\n");
    expect(main([path, "--bogus"])).toBe(2);
  });

  it("rewrites the file in place with --write", () => {
    const path = writeDoc(
      "doc.md",
      "# Guide\n\n<!-- toc -->\n<!-- /toc -->\n\n## Install\n## Usage\n",
    );

    expect(main([path, "--write"])).toBe(0);

    const updated = readFileSync(path, "utf8");
    expect(updated).toContain("- [Guide](#guide)");
    expect(updated).toContain("  - [Install](#install)");
    expect(updated).toContain("  - [Usage](#usage)");
  });

  it("returns 1 when --write is used without markers", () => {
    const path = writeDoc("doc.md", "# No markers\n");
    expect(main([path, "--write"])).toBe(1);
  });

  it("honors the --min and --max level filters", () => {
    const path = writeDoc("doc.md", "# One\n## Two\n### Three\n");
    expect(main([path, "--min", "2", "--max", "2"])).toBe(0);
  });

  it("returns 0 with --check when the TOC is already up to date", () => {
    const upToDate =
      "# Guide\n\n<!-- toc -->\n\n- [Guide](#guide)\n  - [Install](#install)\n  - [Usage](#usage)\n\n<!-- /toc -->\n\n## Install\n## Usage\n";
    const path = writeDoc("doc.md", upToDate);

    expect(main([path, "--check"])).toBe(0);

    // --check must not touch the file
    expect(readFileSync(path, "utf8")).toBe(upToDate);
  });

  it("returns 1 with --check when the TOC is stale", () => {
    const stale = "# Guide\n\n<!-- toc -->\n\n- [Old](#old)\n\n<!-- /toc -->\n\n## Install\n";
    const path = writeDoc("doc.md", stale);

    expect(main([path, "--check"])).toBe(1);
    // --check must not touch the file
    expect(readFileSync(path, "utf8")).toBe(stale);
  });

  it("rejects --write and --check together", () => {
    const path = writeDoc("doc.md", "# A\n");
    expect(main([path, "--write", "--check"])).toBe(2);
  });
});
