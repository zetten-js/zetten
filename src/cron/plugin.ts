import cron from 'node-cron';

import { defaultExt, LoadedFile, Loader, Logger, Plugin } from '@/core';

import { CronJob, cronJobSchema } from './schema';

export const defaultCronPatterns = `**/*.${defaultExt}`;

export class CronPlugin implements Plugin {
  protected files: LoadedFile<CronJob>[] = [];
  private logger = new Logger(CronPlugin.name);
  constructor(protected baseDir: string = "./cron") { }

  async init(): Promise<void> {
    await this.readFrom(this.baseDir, defaultCronPatterns);
    this.files.forEach(file => {
      this.logger.info(`Registered cron job: ${file.name}`);
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
    });
  }

  async readFrom(baseDir: string, ...pattern: string[]) {
    if (!pattern.length) pattern = [defaultCronPatterns];
    
    const files = await Loader.load<CronJob>(baseDir, cronJobSchema, ...pattern);
    files.forEach(file => {
      if (file.module.ignore) {
        this.logger.info(`Ignoring cron job: ${file.name}`);
        return;
      }
      this.files.push(file);
    });
  }
}