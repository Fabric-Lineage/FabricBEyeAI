import { readFileSync, writeFileSync } from 'fs';
import { CONFIG } from './config.js';
import { logger } from './logger.js';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
  dependsOn: string[];
  acceptanceCriteria: string[];
  files: string[];
  blockedReason?: string;
}

interface TaskQueue {
  tasks: Task[];
}

let taskQueue: TaskQueue;

export function loadTaskQueue(): Task[] {
  const raw = readFileSync(CONFIG.taskQueueFile, 'utf-8');
  taskQueue = JSON.parse(raw);
  return taskQueue.tasks;
}

export function saveTaskQueue() {
  writeFileSync(CONFIG.taskQueueFile, JSON.stringify(taskQueue, null, 2) + '\n');
}

export function getNextTask(specificTaskId?: string): Task | null {
  const tasks = taskQueue.tasks;

  if (specificTaskId) {
    const task = tasks.find(t => t.id === specificTaskId && t.status === 'pending');
    return task ?? null;
  }

  // Find highest priority task where all dependencies are done
  const ready = tasks
    .filter(t => t.status === 'pending')
    .filter(t => t.dependsOn.every(depId => {
      const dep = tasks.find(d => d.id === depId);
      return dep?.status === 'done';
    }))
    .sort((a, b) => a.priority - b.priority);

  return ready[0] ?? null;
}

export function markTaskDone(taskId: string) {
  const task = taskQueue.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'done';
    saveTaskQueue();
    logger.success(`Task "${task.title}" marked DONE`);
  }
}

export function markTaskBlocked(taskId: string, reason: string) {
  const task = taskQueue.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'blocked';
    task.blockedReason = reason;
    saveTaskQueue();
    logger.warn(`Task "${task.title}" BLOCKED: ${reason}`);
  }
}

export function markTaskInProgress(taskId: string) {
  const task = taskQueue.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = 'in_progress';
    saveTaskQueue();
  }
}

export function addTask(task: Task) {
  taskQueue.tasks.push(task);
  saveTaskQueue();
  logger.think(`New task added: "${task.title}" (priority ${task.priority})`);
}

export function getTaskStats(): { total: number; done: number; pending: number; blocked: number } {
  const tasks = taskQueue.tasks;
  return {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };
}
