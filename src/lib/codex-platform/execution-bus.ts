import { EventEmitter } from 'node:events';

import type { RuntimeEventRecord } from './types';

const eventBus = new EventEmitter();
eventBus.setMaxListeners(200);

function runChannel(runType: RuntimeEventRecord['runType'], runId: string) {
  return `${runType}:${runId}`;
}

export function publishRuntimeEvent(event: RuntimeEventRecord) {
  eventBus.emit(runChannel(event.runType, event.runId), event);
}

export function subscribeToRunEvents(
  runType: RuntimeEventRecord['runType'],
  runId: string,
  listener: (event: RuntimeEventRecord) => void,
) {
  const channel = runChannel(runType, runId);
  eventBus.on(channel, listener);

  return () => {
    eventBus.off(channel, listener);
  };
}
