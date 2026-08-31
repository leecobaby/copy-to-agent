import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Snippet } from "./format";
import { ContextStack } from "./stack";

function snippet(overrides: Partial<Snippet> = {}): Snippet {
  return {
    path: "src/foo.ts",
    languageId: "typescript",
    startLine: 1,
    endLine: 2,
    code: "a",
    includeCode: true,
    ...overrides,
  };
}

describe("ContextStack", () => {
  it("appends snippets in order", () => {
    const stack = new ContextStack(() => 0);
    stack.add([snippet()], { mode: "append", sessionTimeoutMs: 0 });
    stack.add([snippet({ path: "src/bar.ts" })], { mode: "append", sessionTimeoutMs: 0 });
    assert.equal(stack.length, 2);
    assert.equal(stack.snapshot()[1]?.path, "src/bar.ts");
  });

  it("skips a consecutive duplicate", () => {
    const stack = new ContextStack(() => 0);
    const item = snippet();
    stack.add([item], { mode: "append", sessionTimeoutMs: 0 });
    stack.add([item], { mode: "append", sessionTimeoutMs: 0 });
    assert.equal(stack.length, 1);
  });

  it("replace mode keeps only the latest copy", () => {
    const stack = new ContextStack(() => 0);
    stack.add([snippet()], { mode: "replace", sessionTimeoutMs: 0 });
    stack.add([snippet({ path: "src/bar.ts" })], { mode: "replace", sessionTimeoutMs: 0 });
    assert.deepEqual(
      stack.snapshot().map((item) => item.path),
      ["src/bar.ts"],
    );
  });

  it("starts a new stack after the idle timeout", () => {
    let now = 1_000;
    const stack = new ContextStack(() => now);
    stack.add([snippet()], { mode: "append", sessionTimeoutMs: 5_000 });
    now = 7_000;
    stack.add([snippet({ path: "src/bar.ts" })], { mode: "append", sessionTimeoutMs: 5_000 });
    assert.deepEqual(
      stack.snapshot().map((item) => item.path),
      ["src/bar.ts"],
    );
  });

  it("does not auto-reset when timeout is 0", () => {
    let now = 1_000;
    const stack = new ContextStack(() => now);
    stack.add([snippet()], { mode: "append", sessionTimeoutMs: 0 });
    now = 1_000_000;
    stack.add([snippet({ path: "src/bar.ts" })], { mode: "append", sessionTimeoutMs: 0 });
    assert.equal(stack.length, 2);
  });

  it("undo removes the last snippet and clear empties the stack", () => {
    const stack = new ContextStack(() => 0);
    stack.add([snippet(), snippet({ path: "src/bar.ts" })], {
      mode: "append",
      sessionTimeoutMs: 0,
    });
    assert.equal(stack.undo()?.path, "src/bar.ts");
    assert.equal(stack.length, 1);
    stack.clear();
    assert.equal(stack.length, 0);
    assert.equal(stack.undo(), undefined);
  });
});
