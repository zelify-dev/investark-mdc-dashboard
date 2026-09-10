import type { Messages } from "./messages";

type Segment = string;

function getLeaf(tree: unknown, segments: Segment[]): unknown {
  let current: unknown = tree;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Resolves dotted paths like `nav.top.clients` against the active message tree.
 * Missing keys fall back to the path string so issues are visible in development.
 */
export function createTranslator(messages: Messages) {
  return function t(path: string): string {
    const segments = path.split(".").filter(Boolean);
    const value = getLeaf(messages, segments);
    if (typeof value === "string") return value;
    return path;
  };
}

export type Translate = ReturnType<typeof createTranslator>;
