# Copy to Agent

Select code in Cursor or VS Code, right-click **Copy to Agent**, and paste a path + line-range snippet into an external agent CLI (Claude Code, Codex, Aider, OpenCode, …).

Cursor’s `Cmd+L` / `Ctrl+L` only attaches context to Cursor Chat. This extension writes the same kind of pinpoint context to the **clipboard**, and can stack several snippets before you paste.

## Copy format (default)

```
```12:34:src/auth.ts
export function login() {
  // ...
}
```
```

Paste several of these into a CLI prompt and the agent knows exactly which files and lines you mean.

## Usage

1. Select code (or just park the caret on a line).
2. Right-click → **Copy to Agent** → **Copy Context to Agent**.
   Shortcut: `Cmd+Alt+L` (macOS) / `Ctrl+Alt+L` (Windows/Linux).
3. Paste into your agent CLI.

Chinese UI (when the editor locale is `zh-cn`): the menu reads **拷贝到 Agent** / **将上下文拷贝到 Agent**.

### Multiple snippets (Cmd+L style)

Default mode is `append`. Each copy **adds** to a stack and writes the **whole stack** to the clipboard.

- Status bar shows `Agent 3`. Click it to recopy.
- Right-click → **Remove Last Agent Context** / **Clear Agent Context**.
- After 180s idle (configurable), the next copy starts a fresh stack so yesterday’s snippets do not leak into a new prompt.

Switch `copyToAgent.mode` to `replace` if you want each copy to stand alone.

### Other commands

| Command | What it copies |
| --- | --- |
| Copy Context to Agent | Path + lines + code, stacked |
| Copy Path + Lines to Agent | `src/auth.ts:12-34` only |
| Copy File to Agent | Whole file from the Explorer |
| Recopy Agent Context | Clipboard = current stack, no new snippet |
| Remove Last / Clear | Edit the stack |

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `copyToAgent.format` | `cursor` | `cursor` / `markdown` / `xml` / `ref` |
| `copyToAgent.mode` | `append` | `append` stacks like Cmd+L; `replace` overwrites |
| `copyToAgent.sessionTimeoutSeconds` | `180` | Auto-reset idle stack. `0` = never |
| `copyToAgent.pathStyle` | `relative` | `relative` or `absolute` |
| `copyToAgent.showStatusBar` | `true` | Show snippet count |

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
cursor --install-extension copy-to-agent-0.1.0.vsix
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

Cursor attaches selections to **its own** chat with `Cmd+L`. It does not copy `path:start-end` plus code for an external CLI. VS Code Marketplace already has similar one-shot copiers; this extension’s focus is the **stack** (several precise fragments in one paste).

## License

MIT
