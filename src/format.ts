export type FormatKind = "cursor" | "markdown" | "xml" | "ref";

export interface Snippet {
  path: string;
  languageId: string;
  startLine: number;
  endLine: number;
  code: string;
  includeCode: boolean;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  typescriptreact: "tsx",
  javascriptreact: "jsx",
  typescript: "ts",
  javascript: "js",
  shellscript: "bash",
  jsonc: "json",
  "git-commit": "git",
  ignore: "gitignore",
};

export function languageTag(languageId: string): string {
  return LANGUAGE_ALIASES[languageId] ?? languageId;
}

export function lineRange(snippet: Pick<Snippet, "startLine" | "endLine">): string {
  return snippet.startLine === snippet.endLine
    ? String(snippet.startLine)
    : `${snippet.startLine}-${snippet.endLine}`;
}

export function fenceFor(code: string): string {
  const matches = code.match(/`{3,}/g);
  const longest = matches ? Math.max(...matches.map((m) => m.length)) : 2;
  return "`".repeat(Math.max(3, longest + 1));
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function withTrailingNewline(code: string): string {
  return code.endsWith("\n") ? code : `${code}\n`;
}

function pathRef(snippet: Snippet): string {
  return `${snippet.path}:${lineRange(snippet)}`;
}

function formatCursor(snippet: Snippet): string {
  const fence = fenceFor(snippet.code);
  const header = `${snippet.startLine}:${snippet.endLine}:${snippet.path}`;
  return `${fence}${header}\n${withTrailingNewline(snippet.code)}${fence}`;
}

function formatMarkdown(snippet: Snippet): string {
  const fence = fenceFor(snippet.code);
  const lang = languageTag(snippet.languageId);
  return `${pathRef(snippet)}\n${fence}${lang}\n${withTrailingNewline(snippet.code)}${fence}`;
}

function formatXml(snippet: Snippet): string {
  return `<snippet path="${escapeXml(snippet.path)}" startLine="${snippet.startLine}" endLine="${snippet.endLine}">\n${withTrailingNewline(snippet.code)}</snippet>`;
}

export function formatSnippet(snippet: Snippet, kind: FormatKind): string {
  if (kind === "ref" || !snippet.includeCode) {
    return pathRef(snippet);
  }
  switch (kind) {
    case "cursor":
      return formatCursor(snippet);
    case "markdown":
      return formatMarkdown(snippet);
    case "xml":
      return formatXml(snippet);
  }
}

export function formatStack(snippets: Snippet[], kind: FormatKind): string {
  return snippets.map((snippet) => formatSnippet(snippet, kind)).join("\n\n");
}

export function snippetsEqual(a: Snippet, b: Snippet): boolean {
  return (
    a.path === b.path &&
    a.startLine === b.startLine &&
    a.endLine === b.endLine &&
    a.includeCode === b.includeCode &&
    a.code === b.code
  );
}
