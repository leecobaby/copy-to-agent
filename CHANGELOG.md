# Changelog

## 0.2.0

- Copy Lines (`Cmd+Alt+L`) and Copy Code Block (`Cmd+Alt+B`) always replace the clipboard. They do not stack.
- Stacking is explicit: Add Lines to Context (`Cmd+Alt+=`) and Add Code Block to Context (`Cmd+Alt++`).
- Remove last snippet with `Cmd+Alt+-`. Clear the stack with `Cmd+Alt+Shift+-`.
- Recopy stays on the status bar / command palette, not the editor context menu.

## 0.1.0

- Copy the current selection (or the current line) with file path and line range.
- Accumulate multiple snippets like Cursor Cmd+L, then paste them into an external agent CLI.
- Right-click submenu: copy context, copy path + lines, undo, recopy, clear.
- Formats: `cursor` (default), `markdown`, `xml`, `ref`.
- Status bar count with one-click recopy.
- Explorer: copy a whole file as agent context.
