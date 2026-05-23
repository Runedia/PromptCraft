import { spawn } from 'node:child_process';

const commands = [
  { name: 'server', command: 'bun', args: ['--watch', 'src/server/index.ts'] },
  { name: 'web', command: 'bunx', args: ['--bun', 'vite'] },
];

const children = [];
const settledChildren = new WeakSet();
let shuttingDown = false;
let exitCode = 0;
let remainingChildren = commands.length;
let forceKillTimer = null;

function settleChild(child) {
  if (settledChildren.has(child)) {
    return false;
  }

  settledChildren.add(child);
  remainingChildren -= 1;
  return true;
}

function spawnCommand({ name, command, args }) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  });

  children.push(child);

  child.on('error', (error) => {
    console.error(`[${name}] failed to start:`, error);
    settleChild(child);
    requestShutdown(1);
  });

  child.on('exit', (code, signal) => {
    settleChild(child);

    if (!shuttingDown) {
      requestShutdown(code ?? (signal ? 1 : 0));
    }

    if (shuttingDown && remainingChildren === 0) {
      if (forceKillTimer) {
        clearTimeout(forceKillTimer);
      }

      process.exit(exitCode);
    }
  });
}

function requestChildStop(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  try {
    child.kill('SIGINT');
  } catch {
    // ignore
  }
}

function forceKillChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      shell: false,
      windowsHide: true,
    }).on('error', () => {
      try {
        child.kill('SIGKILL');
      } catch {
        // ignore
      }
    });
    return;
  }

  try {
    child.kill('SIGKILL');
  } catch {
    // ignore
  }
}

function requestShutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  exitCode = code;

  for (const child of children) {
    requestChildStop(child);
  }

  forceKillTimer = setTimeout(() => {
    for (const child of children) {
      forceKillChild(child);
    }
  }, 5000);
}

process.on('SIGINT', () => requestShutdown(130));
process.on('SIGTERM', () => requestShutdown(143));

for (const command of commands) {
  spawnCommand(command);
}
