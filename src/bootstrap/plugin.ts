

import { LoadedFile, Loader } from '@zetten/core/loader';
import { Logger } from '@zetten/core/logger';
import { defaultExt } from '@zetten/core/mode';
import { Plugin } from '@zetten/core/plugin';

import { Bootstrap, bootstrapSchema } from './schema';

const defaultPatterns = [`**/*.bootstrap.${defaultExt}`, `**/*.boot.${defaultExt}`, `**/*.bs.${defaultExt}`];

export class BootstrapPlugin implements Plugin {
  private files: LoadedFile<Bootstrap>[] = [];
  constructor(private baseDir: string, private logger: Logger = console) { }

  init(): void {
    this.readFrom(this.baseDir, ...defaultPatterns);
  }

  async readFrom(baseDir: string, ...pattern: string[]) {
    if (!pattern.length) pattern = defaultPatterns;
    
    const files = await Loader.load<Bootstrap>(baseDir, bootstrapSchema, ...pattern);
    files.forEach(file => {
      if (file.module.ignore) {
        this.logger.info(`Ignoring bootstrap: ${file.name}`);
        return;
      }
      this.files.push(file);
    });
  }
}