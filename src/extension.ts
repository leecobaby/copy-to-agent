import * as vscode from "vscode";
import { formatStack, type FormatKind, type Snippet } from "./format";
import { normalizeSelection } from "./selection";
import { ContextStack, type StackMode } from "./stack";

const FORMAT_KINDS = new Set<FormatKind>(["cursor", "markdown", "xml", "ref"]);

let stack: ContextStack;
let statusBar: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext): void {
  stack = new ContextStack();

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = "copyToAgent.copyStack";
  statusBar.tooltip = "Copy to Agent: recopy stacked context";
  context.subscriptions.push(statusBar);

  context.subscriptions.push(
    vscode.commands.registerCommand("copyToAgent.copy", () => copyFromEditor(true)),
    vscode.commands.registerCommand("copyToAgent.copyPathOnly", () => copyFromEditor(false)),
    vscode.commands.registerCommand("copyToAgent.copyFile", (uri?: vscode.Uri) => copyFile(uri)),
    vscode.commands.registerCommand("copyToAgent.copyStack", recopyStack),
    vscode.commands.registerCommand("copyToAgent.undo", undoLast),
    vscode.commands.registerCommand("copyToAgent.clear", clearStack),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("copyToAgent.showStatusBar")) {
        refreshStatusBar();
      }
    }),
  );

  refreshStatusBar();
}

export function deactivate(): void {
  statusBar?.dispose();
}

function config() {
  const cfg = vscode.workspace.getConfiguration("copyToAgent");
  const formatRaw = cfg.get<string>("format", "cursor");
  const format: FormatKind = FORMAT_KINDS.has(formatRaw as FormatKind)
    ? (formatRaw as FormatKind)
    : "cursor";
  const modeRaw = cfg.get<string>("mode", "append");
  const mode: StackMode = modeRaw === "replace" ? "replace" : "append";
  return {
    format,
    mode,
    sessionTimeoutMs: Math.max(0, cfg.get<number>("sessionTimeoutSeconds", 180)) * 1000,
    pathStyle: cfg.get<"relative" | "absolute">("pathStyle", "relative"),
    showStatusBar: cfg.get<boolean>("showStatusBar", true),
  };
}

async function copyFromEditor(includeCode: boolean): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showWarningMessage("Copy to Agent: 没有打开的编辑器");
    return;
  }

  const snippets = snippetsFromEditor(editor, includeCode, config().pathStyle);
  await writeStack(snippets);
}

async function copyFile(uri?: vscode.Uri): Promise<void> {
  const target = uri ?? vscode.window.activeTextEditor?.document.uri;
  if (!target) {
    void vscode.window.showWarningMessage("Copy to Agent: 没有可拷贝的文件");
    return;
  }

  const document = await vscode.workspace.openTextDocument(target);
  if (document.lineCount === 0) {
    void vscode.window.showWarningMessage("Copy to Agent: 文件是空的");
    return;
  }

  const lastLine = document.lineCount - 1;
  const snippet: Snippet = {
    path: resolvePath(document, config().pathStyle),
    languageId: document.languageId,
    startLine: 1,
    endLine: document.lineCount,
    code: document.getText(new vscode.Range(0, 0, lastLine, document.lineAt(lastLine).text.length)),
    includeCode: true,
  };
  await writeStack([snippet]);
}

async function recopyStack(): Promise<void> {
  if (stack.length === 0) {
    void vscode.window.showInformationMessage("Copy to Agent: 还没有累积的上下文");
    return;
  }
  await vscode.env.clipboard.writeText(formatStack(stack.snapshot(), config().format));
  void vscode.window.setStatusBarMessage(`Copy to Agent: 已重新拷贝 ${stack.length} 段上下文`, 2500);
}

async function undoLast(): Promise<void> {
  const removed = stack.undo();
  if (!removed) {
    void vscode.window.showInformationMessage("Copy to Agent: 没有可撤销的上下文");
    return;
  }

  if (stack.length === 0) {
    await vscode.env.clipboard.writeText("");
  } else {
    await vscode.env.clipboard.writeText(formatStack(stack.snapshot(), config().format));
  }
  refreshStatusBar();
  void vscode.window.setStatusBarMessage(
    stack.length === 0
      ? "Copy to Agent: 已清空"
      : `Copy to Agent: 已撤销，剩余 ${stack.length} 段`,
    2500,
  );
}

async function clearStack(): Promise<void> {
  stack.clear();
  refreshStatusBar();
  void vscode.window.setStatusBarMessage("Copy to Agent: 已清空上下文", 2500);
}

async function writeStack(snippets: Snippet[]): Promise<void> {
  const { format, mode, sessionTimeoutMs } = config();
  const items = stack.add(snippets, { mode, sessionTimeoutMs });
  await vscode.env.clipboard.writeText(formatStack(items, format));
  refreshStatusBar();
  const label = items.length === 1 ? "1 段上下文" : `${items.length} 段上下文`;
  void vscode.window.setStatusBarMessage(`Copy to Agent: 已拷贝 ${label}`, 2500);
}

function snippetsFromEditor(
  editor: vscode.TextEditor,
  includeCode: boolean,
  pathStyle: "relative" | "absolute",
): Snippet[] {
  const document = editor.document;
  const path = resolvePath(document, pathStyle);
  const selections = editor.selections.slice().sort((a, b) => {
    if (a.start.line !== b.start.line) {
      return a.start.line - b.start.line;
    }
    return a.start.character - b.start.character;
  });

  return selections.map((selection) => snippetFromSelection(document, path, selection, includeCode));
}

export function snippetFromSelection(
  document: vscode.TextDocument,
  path: string,
  selection: vscode.Selection,
  includeCode: boolean,
): Snippet {
  const normalized = normalizeSelection({
    startLine: selection.start.line,
    startCharacter: selection.start.character,
    endLine: selection.end.line,
    endCharacter: selection.end.character,
    isEmpty: selection.isEmpty,
  });

  const endPosition =
    normalized.endCharacter < 0
      ? document.lineAt(normalized.endLine).range.end
      : new vscode.Position(normalized.endLine, normalized.endCharacter);

  const startPosition = normalized.useFullLine
    ? new vscode.Position(normalized.startLine, 0)
    : new vscode.Position(normalized.startLine, normalized.startCharacter);

  return {
    path,
    languageId: document.languageId,
    startLine: normalized.startLine + 1,
    endLine: normalized.endLine + 1,
    code: document.getText(new vscode.Range(startPosition, endPosition)),
    includeCode,
  };
}

export function resolvePath(
  document: vscode.TextDocument,
  pathStyle: "relative" | "absolute",
): string {
  if (document.uri.scheme === "untitled") {
    return document.fileName.replaceAll("\\", "/");
  }
  if (pathStyle === "absolute") {
    return document.uri.fsPath.replaceAll("\\", "/");
  }
  const includeWorkspaceFolder = (vscode.workspace.workspaceFolders?.length ?? 0) > 1;
  return vscode.workspace.asRelativePath(document.uri, includeWorkspaceFolder).replaceAll("\\", "/");
}

function refreshStatusBar(): void {
  if (!statusBar) {
    return;
  }
  const { showStatusBar } = config();
  void vscode.commands.executeCommand("setContext", "copyToAgent.hasStack", stack.length > 0);
  if (!showStatusBar || stack.length === 0) {
    statusBar.hide();
    return;
  }
  statusBar.text = `$(copy) Agent ${stack.length}`;
  const preview = stack
    .snapshot()
    .slice(0, 6)
    .map((item) => `${item.path}:${item.startLine}-${item.endLine}`)
    .join("\n");
  statusBar.tooltip = `Copy to Agent\n${preview}${stack.length > 6 ? "\n…" : ""}\n\n点击重新拷贝，Cmd+Alt+Shift+L 清空`;
  statusBar.show();
}
