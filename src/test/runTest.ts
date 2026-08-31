import * as os from "node:os";
import * as path from "node:path";
import { runTests } from "@vscode/test-electron";

function stripHostElectronEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (key === "ELECTRON_RUN_AS_NODE" || key.startsWith("ELECTRON_") || key.startsWith("VSCODE_")) {
      delete process.env[key];
    }
  }
}

async function main(): Promise<void> {
  stripHostElectronEnv();
  const extensionDevelopmentPath = path.resolve(__dirname, "../..");
  const extensionTestsPath = path.resolve(__dirname, "./suite/index");
  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [`--user-data-dir=${path.join(os.tmpdir(), "cta-ud")}`],
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
