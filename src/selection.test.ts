import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeSelection } from "./selection";

describe("normalizeSelection", () => {
  it("treats an empty caret as the current line", () => {
    assert.deepEqual(
      normalizeSelection({
        startLine: 9,
        startCharacter: 4,
        endLine: 9,
        endCharacter: 4,
        isEmpty: true,
      }),
      {
        startLine: 9,
        endLine: 9,
        startCharacter: 0,
        endCharacter: -1,
        useFullLine: true,
      },
    );
  });

  it("keeps a mid-line range as-is", () => {
    assert.deepEqual(
      normalizeSelection({
        startLine: 10,
        startCharacter: 2,
        endLine: 12,
        endCharacter: 8,
        isEmpty: false,
      }),
      {
        startLine: 10,
        endLine: 12,
        startCharacter: 2,
        endCharacter: 8,
        useFullLine: false,
      },
    );
  });

  it("drops the next line when the selection ends at column 0", () => {
    assert.deepEqual(
      normalizeSelection({
        startLine: 9,
        startCharacter: 0,
        endLine: 12,
        endCharacter: 0,
        isEmpty: false,
      }),
      {
        startLine: 9,
        endLine: 11,
        startCharacter: 0,
        endCharacter: -1,
        useFullLine: false,
      },
    );
  });
});
