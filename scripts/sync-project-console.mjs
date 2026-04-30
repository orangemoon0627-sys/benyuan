#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { projectRoadmapBoard } from '../src/lib/project-roadmap.ts';

const opsRoot = process.env.BENYUAN_PROJECT_CONSOLE_DIR ?? '/Users/fanhao/Documents/Playground-ops';
const dataDir = path.join(opsRoot, 'data');
const outFile = path.join(dataDir, 'project-status.json');

await mkdir(dataDir, { recursive: true });
await writeFile(outFile, JSON.stringify({ status: 'ok', board: projectRoadmapBoard }, null, 2), 'utf8');
console.log(`synced:${outFile}`);
