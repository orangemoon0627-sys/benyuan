import { spawn } from 'node:child_process';
import process from 'node:process';

import { maybeRunVisualBaseline } from './tradewise-smoke-shared.mjs';

async function runScript(name, extraEnv = {}) {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await new Promise((resolve, reject) => {
    const child = spawn(command, ['run', name], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...extraEnv,
      },
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${name}_failed_${code ?? 'unknown'}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  console.log('tradewise:route-all:start');
  await runScript('smoke:tradewise:research:route');
  await runScript('smoke:tradewise:review:route');
  await maybeRunVisualBaseline(runScript, 'tradewise:route-all');
  console.log('tradewise:route-all:pass');
}

main().catch((error) => {
  console.error('tradewise:route-all:fail', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
