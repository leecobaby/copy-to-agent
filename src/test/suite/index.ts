import * as vscode from "vscode";
import assert from "node:assert/strict";

async function activate(): Promise<void> {
  const extension = vscode.extensions.getExtension("leecobaby.copy-to-agent");
  assert.ok(extension, "extension leecobaby.copy-to-agent should be installed");
  await extension.activate();
}

async function copySelection(content: string, selection: vscode.Selection): Promise<string> {
  const document = await vscode.workspace.openTextDocument({
    language: "typescript",
    content,
  });
  const editor = await vscode.window.showTextDocument(document);
  editor.selection = selection;
  await vscode.commands.executeCommand("copyToAgent.copy");
  return vscode.env.clipboard.readText();
}

export async function run(): Promise<void> {
  await activate();
  await vscode.commands.executeCommand("copyToAgent.clear");

  const first = await copySelection("const a = 1;\nconst b = 2;\nconst c = 3;\n", new vscode.Selection(0, 0, 2, 0));
  assert.match(first, /```1:2:Untitled-/);
  assert.match(first, /const a = 1;/);
  assert.match(first, /const b = 2;/);
  assert.doesNotMatch(first, /const c = 3;/);

  const second = await copySelection("only-line\n", new vscode.Selection(0, 0, 0, 9));
  assert.match(second, /```1:2:Untitled-/);
  assert.match(second, /```1:1:Untitled-/);
  assert.match(second, /only-line/);

  await vscode.commands.executeCommand("copyToAgent.copyPathOnly");
  const pathOnly = await vscode.env.clipboard.readText();
  assert.match(pathOnly, /Untitled-.*:1/);
  assert.doesNotMatch(pathOnly.split("\n\n").at(-1) ?? "", /```/);

  await vscode.commands.executeCommand("copyToAgent.undo");
  const afterUndo = await vscode.env.clipboard.readText();
  assert.match(afterUndo, /only-line/);
  assert.equal(afterUndo.split("\n\n").filter(Boolean).length, 2);

  await vscode.commands.executeCommand("copyToAgent.clear");
}
