/** Public API for the mdtoc package. */

export {
  TOC_OPEN,
  TOC_CLOSE,
  slugify,
  extractHeadings,
  generateToc,
  updateToc,
} from "./toc.js";

export type { Heading, TocOptions } from "./toc.js";
