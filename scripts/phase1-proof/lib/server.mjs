import { spawn } from "node:child_process";
import http from "node:http";
import { host, port, root, useDevServer } from "./config.mjs";

export function waitForServer(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(url, (response) => { response.resume(); resolve(); });
      request.on("error", () => Date.now() >= deadline ? reject(new Error(`Timed out waiting for ${url}`)) : setTimeout(tick, 500));
    };
    tick();
  });
}

export function run(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  return new Promise((resolve, reject) => child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with ${code ?? "unknown"}`))));
}

export function startServer() {
  return spawn("npm", useDevServer ? ["run", "dev", "--", "--host", host, "--port", String(port)] : ["run", "preview", "--", "--host", host, "--port", String(port)], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
}
