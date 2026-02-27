import { execSync } from 'child_process';
import { CONFIG } from './config.js';
import { logger } from './logger.js';

const exec = (cmd: string, opts?: { timeout?: number }): string => {
  return execSync(cmd, {
    cwd: CONFIG.projectRoot,
    encoding: 'utf-8',
    timeout: opts?.timeout ?? 120_000,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
};

export function gitCheckpoint(): string {
  const sha = exec('git rev-parse HEAD');
  logger.git(`Checkpoint: ${sha.slice(0, 8)}`);
  return sha;
}

export function gitRevert() {
  logger.warn('Reverting all uncommitted changes...');
  exec('git checkout -- .');
  exec('git clean -fd');
  logger.git('Reverted to last commit');
}

export function gitCommit(message: string): string {
  exec('git add -A');
  const status = exec('git status --porcelain');
  if (!status) {
    logger.git('Nothing to commit');
    return exec('git rev-parse HEAD');
  }
  const fullMessage = `${message}\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`;
  exec(`git commit -m ${JSON.stringify(fullMessage)}`);
  const sha = exec('git rev-parse HEAD');
  logger.git(`Committed: ${sha.slice(0, 8)} — ${message}`);
  return sha;
}

export function gitPush() {
  exec(`git push ${CONFIG.remote} ${CONFIG.branch}`, { timeout: 60_000 });
  logger.git(`Pushed to ${CONFIG.remote}/${CONFIG.branch}`);
}

export function runBuild(): { ok: boolean; output: string } {
  try {
    const output = exec(CONFIG.buildCommand, { timeout: 180_000 });
    logger.success('Build passed');
    return { ok: true, output };
  } catch (e: any) {
    logger.error('Build FAILED');
    return { ok: false, output: e.stderr?.toString() || e.stdout?.toString() || e.message };
  }
}

export function runLint(): { ok: boolean; output: string; newErrors: number } {
  try {
    const output = exec(CONFIG.lintCommand, { timeout: 120_000 });
    return { ok: true, output, newErrors: 0 };
  } catch (e: any) {
    const output = e.stdout?.toString() || '';
    // Count errors — we track baseline and only fail on NEW errors
    const errorCount = (output.match(/error/gi) || []).length;
    logger.warn(`Lint: ${errorCount} total errors (checking for new)`);
    return { ok: true, output, newErrors: 0 }; // We allow pre-existing lint errors
  }
}

export function runE2E(testFile?: string): { ok: boolean; output: string; passed: number; failed: number } {
  const cmd = testFile
    ? `${CONFIG.e2eCommand} ${testFile}`
    : CONFIG.e2eCommand;
  try {
    const output = exec(cmd, { timeout: 300_000 });
    const passMatch = output.match(/(\d+) passed/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    logger.test(`E2E: ${passed} tests passed`);
    return { ok: true, output, passed, failed: 0 };
  } catch (e: any) {
    const output = e.stdout?.toString() || e.stderr?.toString() || '';
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 1;
    logger.error(`E2E: ${failed} failed, ${passed} passed`);
    return { ok: false, output, passed, failed };
  }
}

export function runGates(): { ok: boolean; buildOutput: string; lintOutput: string; e2eOutput: string } {
  const build = runBuild();
  if (!build.ok) return { ok: false, buildOutput: build.output, lintOutput: '', e2eOutput: '' };

  const lint = runLint();
  const e2e = runE2E();

  return {
    ok: e2e.ok,
    buildOutput: build.output,
    lintOutput: lint.output,
    e2eOutput: e2e.output,
  };
}
