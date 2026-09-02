import * as vscode from "vscode";
import assert from "node:assert/strict";

async function activate(): Promise<void> {
  const extension = vscode.extensions.getExtension("leecobaby.copy-to-agent");
  assert.ok(extension, "extension leecobaby.copy-to-agent should be installed");
  await extension.activate();
}

async function withSelection(
  content: string,
  selection: vscode.Selection,
  command: string,
): Promise<string> {
  const document = await vscode.workspace.openTextDocument({
    language: "typescript",
    content,
  });
  const editor = await vscode.window.showTextDocument(document);
  editor.selection = selection;
  await vscode.commands.executeCommand(command);
  return vscode.env.clipboard.readText();
}

export async function run(): Promise<void> {
  await activate();
  await vscode.commands.executeCommand("copyToAgent.clear");

  const lines = await withSelection(
    "const a = 1;\nconst b = 2;\nconst c = 3;\n",
    new vscode.Selection(0, 0, 2, 0),
    "copyToAgent.copyLines",
  );
  assert.match(lines, /Untitled-.*:1-2/);
  assert.doesNotMatch(lines, /const a = 1;/);
  assert.doesNotMatch(lines, /```/);

  const block = await withSelection(
    "const a = 1;\nconst b = 2;\nconst c = 3;\n",
    new vscode.Selection(0, 0, 2, 0),
    "copyToAgent.copyBlock",
  );
  assert.match(block, /```1:2:Untitled-/);
  assert.match(block, /const a = 1;/);
  assert.match(block, /const b = 2;/);
  assert.doesNotMatch(block, /const c = 3;/);
  assert.doesNotMatch(block, /Untitled-.*:1-2\n\n```/);

  const replaced = await withSelection(
    "only-line\n",
    new vscode.Selection(0, 0, 0, 9),
    "copyToAgent.copyBlock",
  );
  assert.match(replaced, /only-line/);
  assert.doesNotMatch(replaced, /const a = 1;/);

  await vscode.commands.executeCommand("copyToAgent.clear");

  const addedLines = await withSelection(
    "const a = 1;\n",
    new vscode.Selection(0, 0, 0, 12),
    "copyToAgent.addLines",
  );
  assert.match(addedLines, /Untitled-.*:1/);
  assert.doesNotMatch(addedLines, /```/);

  const addedBlock = await withSelection(
    "only-line\n",
    new vscode.Selection(0, 0, 0, 9),
    "copyToAgent.addBlock",
  );
  assert.match(addedBlock, /Untitled-.*:1/);
  assert.match(addedBlock, /```1:1:Untitled-/);
  assert.match(addedBlock, /only-line/);
  assert.equal(addedBlock.split("\n\n").filter(Boolean).length, 2);

  await vscode.commands.executeCommand("copyToAgent.undo");
  const afterUndo = await vscode.env.clipboard.readText();
  assert.doesNotMatch(afterUndo, /only-line/);
  assert.equal(afterUndo.split("\n\n").filter(Boolean).length, 1);

  await vscode.commands.executeCommand("copyToAgent.clear");
}
