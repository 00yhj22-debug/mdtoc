/**
 * Core logic for extracting headings from Markdown and rendering a table
 * of contents. This module is pure: it performs no file or console I/O.
 */

/** A single heading extracted from a Markdown document. */
export interface Heading {
  /** Heading level, from 1 (`#`) to 6 (`######`). */
  level: number;
  /** The visible heading text, with surrounding whitespace trimmed. */
  text: string;
  /** A GitHub-style anchor slug, unique within the document. */
  slug: string;
}

/** Options shared by {@link extractHeadings} and {@link generateToc}. */
export interface TocOptions {
  /** Lowest heading level to include (default: 1). */
  minLevel?: number;
  /** Highest heading level to include (default: 6). */
  maxLevel?: number;
  /** Indentation string inserted once per nesting level (default: two spaces). */
  indent?: string;
}

/** Marker that opens the managed region used by {@link updateToc}. */
export const TOC_OPEN = "<!-- toc -->";
/** Marker that closes the managed region used by {@link updateToc}. */
export const TOC_CLOSE = "<!-- /toc -->";

const ATX_HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE = /^\s*(`{3,}|~{3,})/;

/**
 * Convert heading text into a GitHub-compatible anchor slug: lower-cased,
 * with punctuation removed and whitespace turned into hyphens.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

/**
 * Extract every ATX heading (`#`-prefixed) from a Markdown document.
 *
 * Headings inside fenced code blocks are ignored, and slugs are made
 * unique by appending `-1`, `-2`, ... to later duplicates — matching the
 * way GitHub renders anchors.
 */
export function extractHeadings(
  markdown: string,
  options: TocOptions = {},
): Heading[] {
  const minLevel = options.minLevel ?? 1;
  const maxLevel = options.maxLevel ?? 6;

  const headings: Heading[] = [];
  const slugCounts = new Map<string, number>();
  let fenceMarker: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const fence = line.match(FENCE);
    if (fence) {
      const marker = fence[1]![0]!;
      if (fenceMarker === null) {
        fenceMarker = marker;
      } else if (fenceMarker === marker) {
        fenceMarker = null;
      }
      continue;
    }
    if (fenceMarker !== null) {
      continue;
    }

    const heading = line.match(ATX_HEADING);
    if (!heading) {
      continue;
    }

    const level = heading[1]!.length;
    if (level < minLevel || level > maxLevel) {
      continue;
    }

    const text = heading[2]!.trim();
    const base = slugify(text);
    const seen = slugCounts.get(base) ?? 0;
    slugCounts.set(base, seen + 1);
    const slug = seen === 0 ? base : `${base}-${seen}`;

    headings.push({ level, text, slug });
  }

  return headings;
}

/**
 * Render a Markdown bullet-list table of contents for a document.
 *
 * Nesting is relative to the shallowest heading present, so a document
 * whose top heading is `##` still produces a list with no leading indent.
 * Returns an empty string when the document has no qualifying headings.
 */
export function generateToc(markdown: string, options: TocOptions = {}): string {
  const indent = options.indent ?? "  ";
  const headings = extractHeadings(markdown, options);
  if (headings.length === 0) {
    return "";
  }

  const baseLevel = Math.min(...headings.map((heading) => heading.level));
  return headings
    .map((heading) => {
      const depth = heading.level - baseLevel;
      return `${indent.repeat(depth)}- [${heading.text}](#${heading.slug})`;
    })
    .join("\n");
}

/**
 * Replace the content between {@link TOC_OPEN} and {@link TOC_CLOSE}
 * markers with a freshly generated table of contents.
 *
 * @throws if the marker pair is missing or out of order.
 */
export function updateToc(markdown: string, options: TocOptions = {}): string {
  const openIndex = markdown.indexOf(TOC_OPEN);
  const closeIndex = markdown.indexOf(TOC_CLOSE);
  if (openIndex === -1 || closeIndex === -1 || closeIndex < openIndex) {
    throw new Error(
      `could not find a "${TOC_OPEN}" / "${TOC_CLOSE}" marker pair to update`,
    );
  }

  const toc = generateToc(markdown, options);
  const block = `${TOC_OPEN}\n\n${toc}\n\n${TOC_CLOSE}`;
  return (
    markdown.slice(0, openIndex) +
    block +
    markdown.slice(closeIndex + TOC_CLOSE.length)
  );
}
