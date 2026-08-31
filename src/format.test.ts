import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fenceFor,
  formatSnippet,
  formatStack,
  languageTag,
  lineRange,
  type Snippet,
} from "./format";

function snippet(overrides: Partial<Snippet> = {}): Snippet {
  return {
    path: "src/foo.ts",
    languageId: "typescript",
    startLine: 12,
    endLine: 34,
    code: "export const x = 1;",
    includeCode: true,
    ...overrides,
  };
}

describe("lineRange", () => {
  it("uses a single number for one line", () => {
    assert.equal(lineRange({ startLine: 8, endLine: 8 }), "8");
  });

  it("uses a hyphenated range for multiple lines", () => {
    assert.equal(lineRange({ startLine: 8, endLine: 12 }), "8-12");
  });
});

describe("languageTag", () => {
  it("maps vscode language ids to fence tags", () => {
    assert.equal(languageTag("typescriptreact"), "tsx");
    assert.equal(languageTag("javascript"), "js");
    assert.equal(languageTag("python"), "python");
  });
});

describe("fenceFor", () => {
  it("uses three backticks by default", () => {
    assert.equal(fenceFor("const x = 1;"), "```");
  });

  it("widens the fence when the code contains backticks", () => {
    assert.equal(fenceFor("example:\n```ts\nconst x = 1;\n```\n"), "````");
    assert.equal(fenceFor("````already"), "`````");
  });
});

describe("formatSnippet", () => {
  it("emits cursor citation fences with start:end:path", () => {
    assert.equal(
      formatSnippet(snippet(), "cursor"),
      "```12:34:src/foo.ts\nexport const x = 1;\n```",
    );
  });

  it("emits markdown path header plus language fence", () => {
    assert.equal(
      formatSnippet(snippet({ languageId: "typescriptreact" }), "markdown"),
      "src/foo.ts:12-34\n```tsx\nexport const x = 1;\n```",
    );
  });

  it("emits xml with escaped paths", () => {
    assert.equal(
      formatSnippet(snippet({ path: 'src/a<"b">.ts' }), "xml"),
      `<snippet path="src/a&lt;&quot;b&quot;&gt;.ts" startLine="12" endLine="34">\nexport const x = 1;\n</snippet>`,
    );
  });

  it("emits path:lines for ref format and when includeCode is false", () => {
    assert.equal(formatSnippet(snippet(), "ref"), "src/foo.ts:12-34");
    assert.equal(
      formatSnippet(snippet({ includeCode: false, startLine: 9, endLine: 9 }), "cursor"),
      "src/foo.ts:9",
    );
  });
});

describe("formatStack", () => {
  it("joins snippets with a blank line", () => {
    const a = snippet({ startLine: 1, endLine: 1, code: "a" });
    const b = snippet({ path: "src/bar.ts", startLine: 4, endLine: 5, code: "b" });
    assert.equal(
      formatStack([a, b], "cursor"),
      "```1:1:src/foo.ts\na\n```\n\n```4:5:src/bar.ts\nb\n```",
    );
  });
});
