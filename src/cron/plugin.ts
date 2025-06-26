import cron from 'node-cron';

import { LoadedFile, Loader } from '../core/loader';
import { Logger } from '../core/logger';
import { defaultExt } from '../core/mode';
import { Plugin } from '../core/plugin';
import { CronJob, cronJobSchema } from './schema';

export const defaultCronPatterns = `**/*.cron.${defaultExt}`;

export abstract class BaseCronPlugin implements Plugin {
  protected files: LoadedFile<CronJob>[] = [];
  constructor(protected baseDir: string = "./cron", private logger: Logger = console) { }

  async init(): Promise<void> {
    await this.readFrom(this.baseDir, defaultCronPatterns);
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