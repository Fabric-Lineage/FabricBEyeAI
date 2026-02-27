import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CONFIG = {
  projectRoot: resolve(__dirname, '../../..'),
  agentRoot: resolve(__dirname, '..'),
  copilotBin: '/opt/homebrew/bin/copilot',
  branch: 'main',
  remote: 'origin',
  maxRetriesPerTask: 3,
  taskTimeoutMs: 15 * 60 * 1000,      // 15 min per task
  defaultSessionTimeoutMs: 4 * 60 * 60 * 1000, // 4 hours
  buildCommand: 'npm run build',
  lintCommand: 'npm run lint',
  e2eCommand: 'npx playwright test --reporter=line',
  serveCommand: 'npx ng serve --port 4200',
  logFile: resolve(__dirname, '..', 'agent.log'),
  taskQueueFile: resolve(__dirname, 'task-queue.json'),
  backlogFile: resolve(__dirname, 'backlog.json'),
} as const;

export function parseArgs(): { timeout: number; task?: string; logFile?: string } {
  const args = process.argv.slice(2);
  let timeout = CONFIG.defaultSessionTimeoutMs;
  let task: string | undefined;
  let logFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--timeout' && args[i + 1]) {
      const val = args[++i];
      if (val.endsWith('h')) timeout = parseFloat(val) * 3600_000;
      else if (val.endsWith('m')) timeout = parseFloat(val) * 60_000;
      else timeout = parseFloat(val) * 1000;
    } else if (args[i] === '--task' && args[i + 1]) {
      task = args[++i];
    } else if (args[i] === '--log-file' && args[i + 1]) {
      logFile = args[++i];
    }
  }

  return { timeout, task, logFile };
}
