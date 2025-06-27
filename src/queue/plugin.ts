import { defaultExt, Logger } from '@/core';
import { LoadedFile, Loader } from '@/core/loader';

import { Queue, queueSchema } from './schema';

export const defaultQueuePatterns = `**/*.${defaultExt}`;

export abstract class QueuePlugin {
  protected abstract logger: Logger;
  protected files: LoadedFile<Queue>[] = [];
  constructor(protected baseDir: string) { }

  abstract init(): void;

  async readFrom(baseDir: string, ...pattern: string[]) {
    if (!pattern.length) pattern = [defaultQueuePatterns];
    
    const files = await Loader.load<Queue>(baseDir, queueSchema, ...pattern);
    files.forEach(file => {
      if (file.module.ignore) {
        this.logger.info(`Ignoring queue: ${file.name}`);
        return;
      }
      this.files.push(file);
    });
  }
}