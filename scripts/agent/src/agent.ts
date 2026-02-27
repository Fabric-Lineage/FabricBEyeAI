#!/usr/bin/env node
/**
 * FabricBEyeAI Autonomous Agent
 *
 * Runs as an AI Project Lead: Perceive → Reason → Act → Verify
 * Uses the Copilot CLI to implement tasks, tests them, commits, and pushes.
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { CONFIG, parseArgs } from './config.js';
import { logger, setLogFile } from './logger.js';
import {
  loadTaskQueue, getNextTask, markTaskDone, markTaskBlocked,
  markTaskInProgress, getTaskStats, type Task
} from './task-queue.js';
import { SYSTEM_PROMPT } from './system-prompt.js';
import {
  gitCheckpoint, gitRevert, gitCommit, gitPush,
  runBuild, runE2E, runGates
} from './safety.js';

const args = parseArgs();
if (args.logFile) setLogFile(args.logFile);

const startTime = Date.now();

function timeRemaining(): number {
  return args.timeout - (Date.now() - startTime);
}

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Execute a task using the Copilot CLI.
 * Sends the task prompt to `copilot` via stdin in headless mode.
 */
async function executeTaskWithCopilot(task: Task): Promise<{ success: boolean; output: string }> {
  const prompt = buildTaskPrompt(task);

  return new Promise((resolve) => {
    const timeout = Math.min(CONFIG.taskTimeoutMs, timeRemaining());

    logger.dev(`Sending task to Copilot CLI (timeout: ${formatMs(timeout)})`);

    const copilot = spawn(CONFIG.copilotBin, [], {
      cwd: CONFIG.projectRoot,
      env: { ...process.env, COPILOT_HEADLESS: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout,
    });

    let stdout = '';
    let stderr = '';

    copilot.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    copilot.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    copilot.on('close', (code) => {
      const output = stdout + '\n' + stderr;
      resolve({ success: code === 0, output });
    });

    copilot.on('error', (err) => {
      resolve({ success: false, output: err.message });
    });

    // Send the prompt and close stdin
    copilot.stdin?.write(prompt);
    copilot.stdin?.end();

    // Safety timeout
    setTimeout(() => {
      try { copilot.kill('SIGTERM'); } catch {}
      resolve({ success: false, output: 'Task timed out' });
    }, timeout);
  });
}

function buildTaskPrompt(task: Task): string {
  const filesContext = task.files.map(f => {
    const fullPath = `${CONFIG.projectRoot}/${f}`;
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        return `### ${f}\n\`\`\`typescript\n${content.slice(0, 5000)}\n\`\`\``;
      } catch { return `### ${f}\n(could not read)`; }
    }
    return `### ${f}\n(file does not exist yet — create it)`;
  }).join('\n\n');

  return `## Task: ${task.title}

${task.description}

### Acceptance Criteria
${task.acceptanceCriteria.map(c => `- ${c}`).join('\n')}

### Relevant Files
${filesContext}

### Instructions
1. Read the relevant files listed above
2. Implement the changes described
3. Make minimal, surgical changes — don't refactor unrelated code
4. When done, ensure the code compiles (no TypeScript errors)
5. Do NOT run build or tests — the agent harness will do that

Implement now.
`;
}

async function runTaskCycle(task: Task): Promise<boolean> {
  logger.info(`Task ${task.id}: "${task.title}" (priority ${task.priority})`);
  markTaskInProgress(task.id);

  const checkpoint = gitCheckpoint();

  for (let attempt = 1; attempt <= CONFIG.maxRetriesPerTask; attempt++) {
    logger.dev(`Attempt ${attempt}/${CONFIG.maxRetriesPerTask}`);

    // Step 1: Execute with Copilot
    const result = await executeTaskWithCopilot(task);

    if (!result.success) {
      logger.error(`Copilot execution failed: ${result.output.slice(0, 200)}`);
      if (attempt < CONFIG.maxRetriesPerTask) {
        gitRevert();
        continue;
      }
      break;
    }

    // Step 2: Run gates (build + lint + E2E)
    logger.info('Running quality gates...');
    const gates = runGates();

    if (gates.ok) {
      // Step 3: Commit and push
      const sha = gitCommit(`feat: ${task.title.toLowerCase()}`);
      gitPush();
      markTaskDone(task.id);
      return true;
    }

    // Gates failed — retry
    logger.error(`Quality gates failed on attempt ${attempt}`);
    if (attempt < CONFIG.maxRetriesPerTask) {
      logger.warn('Reverting and retrying...');
      gitRevert();
    }
  }

  // All retries exhausted
  gitRevert();
  markTaskBlocked(task.id, `Failed after ${CONFIG.maxRetriesPerTask} attempts`);
  return false;
}

async function main() {
  logger.initLogFile();
  logger.start(`FabricBEyeAI Agent started. Timeout: ${formatMs(args.timeout)}`);

  // Load task queue
  const tasks = loadTaskQueue();
  const stats = getTaskStats();
  logger.info(`${stats.total} tasks: ${stats.done} done, ${stats.pending} pending, ${stats.blocked} blocked`);

  if (args.task) {
    logger.info(`Single task mode: ${args.task}`);
  }

  let tasksCompleted = 0;
  let tasksFailed = 0;

  // Main loop
  while (timeRemaining() > 60_000) { // Keep 1 min buffer
    const task = getNextTask(args.task);

    if (!task) {
      if (args.task) {
        logger.warn(`Task "${args.task}" not found or not pending`);
      } else {
        logger.success('All tasks done or no ready tasks!');
      }
      break;
    }

    const success = await runTaskCycle(task);
    if (success) tasksCompleted++;
    else tasksFailed++;

    // Single task mode — exit after one
    if (args.task) break;

    // Log progress
    const remaining = formatMs(timeRemaining());
    logger.info(`Progress: ${tasksCompleted} done, ${tasksFailed} failed. Time remaining: ${remaining}`);
  }

  // Final summary
  const elapsed = formatMs(Date.now() - startTime);
  const finalStats = getTaskStats();
  logger.summary(`Agent finished in ${elapsed}`);
  logger.summary(`Tasks: ${finalStats.done}/${finalStats.total} done, ${finalStats.blocked} blocked`);
  logger.summary(`This session: ${tasksCompleted} completed, ${tasksFailed} failed`);
}

main().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
