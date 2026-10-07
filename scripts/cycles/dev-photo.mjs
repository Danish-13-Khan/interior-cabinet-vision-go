#!/usr/bin/env node
/**
 * Production-shaped local run in one command: the app on http://localhost:1420 and the
 * Cycles render service on http://localhost:8787, wired together, nothing to configure.
 *
 *   npm run dev:photo
 *
 * The app discovers the service on localhost by itself; VITE_CYCLES_RENDER_URL is also
 * set here so a built bundle from this shell points at it too. Ctrl-C stops both.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// The app's own port may arrive as PORT (preview runners set it); the service has its own.
const appPort = process.env.APP_PORT ?? "1420";
const cyclesPort = process.env.CYCLES_PORT ?? "8787";
const serviceUrl = `http://localhost:${cyclesPort}`;
const env = { ...process.env, VITE_CYCLES_RENDER_URL: process.env.VITE_CYCLES_RENDER_URL ?? serviceUrl };

function run(label, command, args, extraEnv = {}) {
  const child = spawn(command, args, { cwd: root, env: { ...env, ...extraEnv }, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  const relay = (stream) => (chunk) => {
    for (const line of chunk.toString().split("\n")) if (line.trim()) stream.write(`[${label}] ${line}\n`);
  };
  child.stdout.on("data", relay(process.stdout));
  child.stderr.on("data", relay(process.stderr));
  return child;
}

const service = run("cycles", process.execPath, [join(root, "scripts", "cycles", "serve.mjs")], { PORT: cyclesPort });
const app = run("app", "npx", ["vite", "--port", appPort, "--strictPort"]);

const stop = () => {
  service.kill("SIGTERM");
  app.kill("SIGTERM");
};
process.on("SIGINT", () => { stop(); process.exit(0); });
process.on("SIGTERM", () => { stop(); process.exit(0); });
app.on("exit", (code) => { service.kill("SIGTERM"); process.exit(code ?? 0); });
service.on("exit", (code) => {
  if (code && code !== 0) process.stderr.write(`[cycles] render service exited with ${code}; the app keeps running without Render photo\n`);
});
