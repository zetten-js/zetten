import cron from 'node-cron';

import { Logger } from '@zetten/core/logger';
import { BaseCronPlugin, defaultCronPatterns } from '@zetten/cron/plugin';

export class NodeCronPlugin extends BaseCronPlugin {
  async init(): Promise<void> {
    await this.readFrom(this.baseDir, ...this.patterns);
    this.files.forEach(file => {
      cron.schedule(
        file.module.options.schedule,
        file.module.job,
        { 
          timezone: file.module.options.timezone,
          maxExecutions: file.module.options.maxExecutions,
          maxRandomDelay: file.module.options.maxRandomDelay,
          noOverlap: file.module.options.noOverlap,
          name: file.module.options.name
        },
      );
    })
  }

  constructor(baseDir: string, private patterns: string[] = [defaultCronPatterns], logger: Logger = console) {
    super(baseDir, logger);
  }
}