import { appendFileSync, writeFileSync } from 'fs';
import { CONFIG } from './config.js';

let logFilePath = CONFIG.logFile;

export function setLogFile(path: string) {
  logFilePath = path;
}

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function write(level: string, emoji: string, message: string) {
  const line = `[${timestamp()}] ${emoji} ${message}`;
  console.log(line);
  try {
    appendFileSync(logFilePath, line + '\n');
  } catch { /* ignore if file not writable */ }
}

export const logger = {
  info: (msg: string) => write('INFO', '📋', msg),
  success: (msg: string) => write('OK', '✅', msg),
  error: (msg: string) => write('ERROR', '❌', msg),
  warn: (msg: string) => write('WARN', '⚠️', msg),
  think: (msg: string) => write('THINK', '🧠', msg),
  dev: (msg: string) => write('DEV', '🔨', msg),
  git: (msg: string) => write('GIT', '📦', msg),
  test: (msg: string) => write('TEST', '🧪', msg),
  start: (msg: string) => write('START', '🚀', msg),
  summary: (msg: string) => write('SUMMARY', '📊', msg),

  initLogFile() {
    try {
      writeFileSync(logFilePath, `=== FabricBEyeAI Agent Log ===\nStarted: ${timestamp()}\n\n`);
    } catch { /* ignore */ }
  }
};
