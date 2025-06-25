import { LoadedFile, Loader } from '../core/loader';
import { Logger } from '../core/logger';
import { defaultExt } from '../core/mode';
import { Plugin } from '../core/plugin';
import { Zetten } from '../core/server';
import { CronJob, cronJobSchema } from './schema';

export const defaultCronPatterns = `**/*.cron.${defaultExt}`;

export abstract class BaseCronPlugin implements Plugin {
  protected files: LoadedFile<CronJob>[] = [];
  constructor(protected baseDir: string, private logger: Logger = console) { }

  abstract init(zetten: Zetten): void

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