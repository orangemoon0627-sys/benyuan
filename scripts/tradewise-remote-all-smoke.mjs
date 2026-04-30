import { spawn } from 'node:child_process';
import process from 'node:process';

const baseUrl =
  (process.env.BENYUAN_BASE_URL ?? process.env.TRADEWISE_SMOKE_BASE_URL ?? '').trim() ||
  'http://127.0.0.1:3201';

async function runScript(name, extraEnv = {}) {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await new Promise((resolve, reject) => {
    const child = spawn(command, ['run', name], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BENYUAN_BASE_URL: baseUrl,
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
  console.log(`tradewise:remote-all:start base=${baseUrl}`);
  await runScript('smoke:tradewise:research', { TRADEWISE_EXPECT_RESEARCH_LIVE: '1' });
  await runScript('smoke:tradewise:crs');
  console.log('tradewise:remote-all:pass');
}

main().catch((error) => {
  console.error('tradewise:remote-all:fail', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
