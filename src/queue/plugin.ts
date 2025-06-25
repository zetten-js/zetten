
import { LoadedFile, Loader } from '@zetten/core/loader';
import { Logger } from '@zetten/core/logger';
import { defaultExt } from '@zetten/core/mode';

import { Queue, queueSchema } from './schema';

export const defaultQueuePatterns = `**/*.queue.${defaultExt}`;

export abstract class QueuePlugin {
  protected files: LoadedFile<Queue>[] = [];
  constructor(protected baseDir: string, protected logger: Logger = console) { }

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