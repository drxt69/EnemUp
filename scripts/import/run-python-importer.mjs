import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const codexPython =
  "C:\\Users\\Ruan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
const script = process.argv[2];
const args = process.argv.slice(3);
const python = process.env.PYTHON_IMPORTER ?? (existsSync(codexPython) ? codexPython : "python");

if (!script) {
  console.error("Missing Python script path.");
  process.exit(1);
}

execFileSync(python, [script, ...args], { stdio: "inherit" });
