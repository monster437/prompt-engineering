import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const cleanOnly = args.includes("--clean-only");
const forwardedArgs = args.filter((arg) => arg !== "--clean-only");

const projectRoot = resolve(process.cwd());
const projectRootNormalized = normalizePath(projectRoot);
const nextDir = resolve(projectRoot, ".next");
const defaultPort = parseDevPort(forwardedArgs);

function normalizePath(value) {
  return String(value).replaceAll("/", "\\").toLowerCase();
}

function parseDevPort(nextArgs) {
  for (let index = 0; index < nextArgs.length; index += 1) {
    const arg = nextArgs[index];

    if ((arg === "--port" || arg === "-p") && nextArgs[index + 1]) {
      const parsed = Number.parseInt(nextArgs[index + 1], 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }

    if (arg.startsWith("--port=") || arg.startsWith("-p=")) {
      const parsed = Number.parseInt(arg.split("=")[1] ?? "", 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  const fromEnv = Number.parseInt(process.env.PORT ?? "", 10);
  return Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : 3000;
}

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function runCommand(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: projectRoot,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !options.ignoreExitCode) {
    const stderr = result.stderr?.trim();
    throw new Error(
      stderr
        ? `[dev:clean] Command failed: ${command} ${commandArgs.join(" ")}\n${stderr}`
        : `[dev:clean] Command failed: ${command} ${commandArgs.join(" ")}`
    );
  }

  return {
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    status: result.status ?? 0
  };
}

function runPowerShell(script, options = {}) {
  return runCommand(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
    options
  );
}

function parseJsonRecords(text) {
  if (!text.trim()) {
    return [];
  }

  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) {
    return parsed;
  }

  return parsed ? [parsed] : [];
}

function psQuote(value) {
  return String(value).replaceAll("'", "''");
}

function getProcessId(processInfo) {
  const pid = Number(processInfo.ProcessId ?? processInfo.pid ?? processInfo.PID ?? 0);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function getCommandLine(processInfo) {
  return String(processInfo.CommandLine ?? processInfo.command ?? "").trim();
}

function isProjectNextProcess(processInfo) {
  const commandLine = normalizePath(getCommandLine(processInfo));
  if (!commandLine || !commandLine.includes(projectRootNormalized)) {
    return false;
  }

  return commandLine.includes("next\\dist\\bin\\next") || commandLine.includes("start-server.js");
}

function describeProcess(processInfo) {
  const pid = getProcessId(processInfo) ?? "unknown";
  const name = processInfo.Name ?? processInfo.name ?? "process";
  const commandLine = getCommandLine(processInfo);
  return `PID ${pid} (${name})${commandLine ? ` - ${commandLine}` : ""}`;
}

function findProjectNextProcessesWindows() {
  const script = `
    $root = '${psQuote(projectRootNormalized)}'
    $items = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
      Where-Object {
        $_.ProcessId -ne ${process.pid} -and
        $_.CommandLine -and
        $_.CommandLine.ToLower().Contains($root) -and
        (
          $_.CommandLine -like '*next\\dist\\bin\\next*' -or
          $_.CommandLine -like '*start-server.js*'
        )
      } |
      Select-Object ProcessId, Name, CommandLine

    if ($items) {
      $items | ConvertTo-Json -Compress
    }
  `;

  return parseJsonRecords(runPowerShell(script, { ignoreExitCode: true }).stdout);
}

function findProjectNextProcessesPosix() {
  const { stdout } = runCommand("ps", ["-eo", "pid=,command="], { ignoreExitCode: true });

  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match) {
        return null;
      }

      return {
        pid: Number.parseInt(match[1], 10),
        command: match[2],
        name: "node"
      };
    })
    .filter((item) => item && item.pid !== process.pid && isProjectNextProcess(item));
}

function findProjectNextProcesses() {
  if (process.platform === "win32") {
    return findProjectNextProcessesWindows();
  }

  return findProjectNextProcessesPosix();
}

function getProcessInfoByPidWindows(pid) {
  const script = `
    $item = Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" |
      Select-Object ProcessId, Name, CommandLine

    if ($item) {
      $item | ConvertTo-Json -Compress
    }
  `;

  return parseJsonRecords(runPowerShell(script, { ignoreExitCode: true }).stdout)[0] ?? null;
}

function findListeningPortOwnersWindows(port) {
  const { stdout } = runCommand("netstat", ["-ano", "-p", "tcp"], { ignoreExitCode: true });
  const owners = new Map();

  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("TCP")) {
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) {
      continue;
    }

    const localAddress = parts[1];
    const state = parts[3];
    const pid = Number.parseInt(parts[4], 10);
    const portMatch = localAddress.match(/:(\d+)$/);

    if (!portMatch || state !== "LISTENING" || Number.parseInt(portMatch[1], 10) !== port || !Number.isInteger(pid)) {
      continue;
    }

    if (!owners.has(pid)) {
      const info = getProcessInfoByPidWindows(pid);
      if (info) {
        owners.set(pid, info);
      }
    }
  }

  return Array.from(owners.values());
}

function findListeningPortOwnersPosix(port) {
  const { stdout } = runCommand("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], { ignoreExitCode: true });

  return stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      const pid = Number.parseInt(parts[1] ?? "", 10);

      if (!Number.isInteger(pid)) {
        return null;
      }

      return {
        pid,
        name: parts[0] ?? "process",
        command: line
      };
    })
    .filter(Boolean);
}

function findListeningPortOwners(port) {
  if (process.platform === "win32") {
    return findListeningPortOwnersWindows(port);
  }

  return findListeningPortOwnersPosix(port);
}

async function stopProcesses(processInfos, reason) {
  const processIds = Array.from(
    new Set(
      processInfos
        .map(getProcessId)
        .filter((pid) => pid !== null)
    )
  );

  if (processIds.length === 0) {
    return;
  }

  console.log(`[dev:clean] Stopping ${reason}: ${processIds.join(", ")}`);

  if (process.platform === "win32") {
    runCommand(
      "taskkill",
      [...processIds.flatMap((pid) => ["/PID", String(pid)]), "/T", "/F"],
      { ignoreExitCode: true }
    );
  } else {
    for (const pid of processIds) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        // Ignore already-exited processes.
      }
    }
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const remainingProjectProcesses = findProjectNextProcesses().filter((processInfo) =>
      processIds.includes(getProcessId(processInfo))
    );

    if (remainingProjectProcesses.length === 0) {
      return;
    }

    await sleep(250);
  }

  console.warn(`[dev:clean] Some processes may still be exiting: ${processIds.join(", ")}`);
}

async function stopStaleProjectDevProcesses() {
  const staleProcesses = findProjectNextProcesses();

  if (staleProcesses.length === 0) {
    console.log("[dev:clean] No stale Next dev processes found for this project.");
    return;
  }

  console.log("[dev:clean] Found stale project dev processes:");
  for (const processInfo of staleProcesses) {
    console.log(`  - ${describeProcess(processInfo)}`);
  }

  await stopProcesses(staleProcesses, "stale project dev processes");
}

async function cleanNextArtifacts() {
  if (!existsSync(nextDir)) {
    console.log("[dev:clean] .next does not exist, skipping cleanup.");
    return;
  }

  console.log("[dev:clean] Removing .next ...");
  await rm(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  console.log("[dev:clean] Removed .next");
}

async function ensurePortAvailable(port) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const owners = findListeningPortOwners(port);

    if (owners.length === 0) {
      console.log(`[dev:clean] Port ${port} is available.`);
      return;
    }

    const projectOwners = owners.filter(isProjectNextProcess);

    if (projectOwners.length > 0) {
      await stopProcesses(projectOwners, `project processes still holding port ${port}`);
      await sleep(250);
      continue;
    }

    const ownerDescriptions = owners.map(describeProcess).join("\n  - ");
    throw new Error(
      `[dev:clean] Port ${port} is already in use by another process:\n  - ${ownerDescriptions}\n请先关闭它，或者改用 npm run dev:clean -- --port <新端口>`
    );
  }

  throw new Error(`[dev:clean] Timed out while waiting for port ${port} to become available.`);
}

async function main() {
  await stopStaleProjectDevProcesses();
  await cleanNextArtifacts();
  await ensurePortAvailable(defaultPort);

  if (cleanOnly) {
    return;
  }

  const nextBin = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, "dev", ...forwardedArgs], {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env
  });

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", forwardSignal);
  process.on("SIGTERM", forwardSignal);

  child.on("exit", (code, signal) => {
    process.off("SIGINT", forwardSignal);
    process.off("SIGTERM", forwardSignal);

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error("[dev:clean] Failed to clean/start dev server.");
  console.error(error);
  process.exit(1);
});
