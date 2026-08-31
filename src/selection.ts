export interface EditorRange {
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
  isEmpty: boolean;
}

export interface NormalizedSelection {
  startLine: number;
  endLine: number;
  startCharacter: number;
  /** Character on endLine. -1 means through the end of that line. */
  endCharacter: number;
  useFullLine: boolean;
}

export function normalizeSelection(selection: EditorRange): NormalizedSelection {
  if (selection.isEmpty) {
    return {
      startLine: selection.endLine,
      endLine: selection.endLine,
      startCharacter: 0,
      endCharacter: -1,
      useFullLine: true,
    };
  }

  let endLine = selection.endLine;
  let endCharacter = selection.endCharacter;
  if (selection.endCharacter === 0 && endLine > selection.startLine) {
    endLine -= 1;
    endCharacter = -1;
  }

  return {
    startLine: selection.startLine,
    endLine,
    startCharacter: selection.startCharacter,
    endCharacter,
    useFullLine: false,
  };
}
