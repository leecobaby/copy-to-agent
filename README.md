# Copy to Agent

Select code in Cursor or VS Code, right-click **Copy to Agent**, and paste a path + line-range snippet into an external agent CLI (Claude Code, Codex, Aider, OpenCode, …).

Cursor’s `Cmd+L` / `Ctrl+L` only attaches context to Cursor Chat. This extension writes the same kind of pinpoint context to the **clipboard**.

## One-shot copy (default)

These **replace** the clipboard. They do not accumulate.

| Command | macOS | Windows / Linux | Clipboard |
| --- | --- | --- | --- |
| **Copy Lines** | `Cmd+Alt+L` | `Ctrl+Alt+L` | `src/auth.ts:12-34` |
| **Copy Code Block** | `Cmd+Alt+B` | `Ctrl+Alt+B` | Path + lines + fenced code |

Copy Lines is the frequent path: most agents can open the file from the line range.

Default code-block format:

````
```12:34:src/auth.ts
export function login() {
  // ...
}
```
````

## Add to context (optional stack)

Use this only when one paste should contain **several** locations. Each add **appends** to an in-memory stack and writes the **whole stack** to the clipboard.

| Command | macOS | Windows / Linux |
| --- | --- | --- |
| **Add Lines to Context** | `Cmd+Alt+=` | `Ctrl+Alt+=` |
| **Add Code Block to Context** | `Cmd+Alt++` (`Cmd+Alt+Shift+=`) | `Ctrl+Alt+Shift+=` |
| **Remove Last from Context** | `Cmd+Alt+-` | `Ctrl+Alt+-` |
| **Clear Context** | `Cmd+Alt+Shift+-` | `Ctrl+Alt+Shift+-` |

Status bar shows `Agent 3` while the stack is non-empty. Click it to recopy. After 180s idle (configurable), the next add starts a fresh stack.

Chinese UI (`zh-cn`): **复制行** / **复制代码块** / **添加到上下文（行）** / **添加到上下文（代码块）**.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `copyToAgent.format` | `cursor` | `cursor` / `markdown` / `xml` / `ref` |
| `copyToAgent.sessionTimeoutSeconds` | `180` | Auto-reset idle **stack**. `0` = never |
| `copyToAgent.pathStyle` | `relative` | `relative` or `absolute` |
| `copyToAgent.showStatusBar` | `true` | Show snippet count while stacked |

`markdown` example:

```
src/auth.ts:12-34
```ts
export function login() {}
```
```

`xml` example:

```xml
<snippet path="src/auth.ts" startLine="12" endLine="34">
export function login() {}
</snippet>
```

## Install

Source: [github.com/leecobaby/copy-to-agent](https://github.com/leecobaby/copy-to-agent)

### From VSIX (Cursor)

```bash
cursor --install-extension copy-to-agent-0.2.0.vsix
```

Or in Cursor: Extensions → `…` → **Install from VSIX…**

Reload the window after installing.

### From source

```bash
npm install
npm test
npm run package
```

Then install the generated `.vsix`. Press `F5` in this folder to launch an Extension Development Host.

## Why not a built-in Cursor command?

Cursor attaches selections to **its own** chat with `Cmd+L`. It does not copy `path:start-end` (or a code block) for an external CLI.

## License

MIT
