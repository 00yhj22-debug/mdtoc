import { describe, it, expect } from "vitest";

import {
  slugify,
  extractHeadings,
  generateToc,
  updateToc,
  TOC_OPEN,
  TOC_CLOSE,
} from "../src/index.js";

describe("slugify", () => {
  it("lower-cases text and hyphenates spaces", () => {
    expect(slugify("Getting Started")).toBe("getting-started");
  });

  it("drops punctuation", () => {
    expect(slugify("What's new?")).toBe("whats-new");
  });

  it("keeps the hyphen pattern GitHub produces for symbols", () => {
    expect(slugify("API & SDK")).toBe("api--sdk");
  });

  it("preserves non-ASCII letters", () => {
    expect(slugify("설치 방법")).toBe("설치-방법");
  });
});

describe("extractHeadings", () => {
  it("reads level, text, and slug for each heading", () => {
    const headings = extractHeadings("# Title\n## Section\n");
    expect(headings).toEqual([
      { level: 1, text: "Title", slug: "title" },
      { level: 2, text: "Section", slug: "section" },
    ]);
  });

  it("ignores headings inside fenced code blocks", () => {
    const markdown = ["# Real", "", "```", "# Fake", "```", "", "## Also Real"].join(
      "\n",
    );
    expect(extractHeadings(markdown).map((h) => h.text)).toEqual([
      "Real",
      "Also Real",
    ]);
  });

  it("de-duplicates repeated slugs", () => {
    const headings = extractHeadings("# Notes\n# Notes\n# Notes\n");
    expect(headings.map((h) => h.slug)).toEqual(["notes", "notes-1", "notes-2"]);
  });

  it("strips trailing closing hashes", () => {
    expect(extractHeadings("## Heading ##\n")[0]?.text).toBe("Heading");
  });

  it("honors minLevel and maxLevel", () => {
    const markdown = "# One\n## Two\n### Three\n";
    const headings = extractHeadings(markdown, { minLevel: 2, maxLevel: 2 });
    expect(headings.map((h) => h.text)).toEqual(["Two"]);
  });

  it("does not treat '#hashtag' without a space as a heading", () => {
    expect(extractHeadings("#nope\n")).toEqual([]);
  });
});

describe("generateToc", () => {
  it("indents relative to the shallowest heading", () => {
    const markdown = "## Top\n### Child\n#### Grandchild\n";
    expect(generateToc(markdown)).toBe(
      ["- [Top](#top)", "  - [Child](#child)", "    - [Grandchild](#grandchild)"].join(
        "\n",
      ),
    );
  });

  it("supports a custom indent string", () => {
    const markdown = "# A\n## B\n";
    expect(generateToc(markdown, { indent: "\t" })).toBe(
      "- [A](#a)\n\t- [B](#b)",
    );
  });

  it("returns an empty string when there are no headings", () => {
    expect(generateToc("just a paragraph\n")).toBe("");
  });
});

describe("updateToc", () => {
  it("replaces content between the markers", () => {
    const markdown = [
      "# Doc",
      "",
      TOC_OPEN,
      "stale content",
      TOC_CLOSE,
      "",
      "## Section",
    ].join("\n");

    const result = updateToc(markdown);
    expect(result).toContain(`${TOC_OPEN}\n\n- [Doc](#doc)\n  - [Section](#section)\n\n${TOC_CLOSE}`);
    expect(result).not.toContain("stale content");
  });

  it("throws when the marker pair is missing", () => {
    expect(() => updateToc("# No markers here\n")).toThrow(/marker pair/);
  });
});
