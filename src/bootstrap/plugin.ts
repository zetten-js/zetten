
import { defaultExt, Logger } from '@/core';
import { LoadedFile, Loader } from '@/core/loader';
import { Plugin } from '@/core/plugin';

import { Bootstrap, bootstrapSchema } from './schema';

const defaultPatterns = [`**/*.${defaultExt}`];

export class BootstrapPlugin implements Plugin {
  private files: LoadedFile<Bootstrap>[] = [];
  private logger = new Logger(BootstrapPlugin.name);
  constructor(private baseDir: string = "./bootstrap") { }

  async init(): Promise<void> {
    await this.readFrom(this.baseDir, ...defaultPatterns);
    this.files.sort((a, b) => {
      const orderA = a.module.options?.order ?? Infinity;
      const orderB = b.module.options?.order ?? Infinity;
      return orderA - orderB;
    });

    for (const file of this.files) {
      try {
        await file.module.fn();
        this.logger.info(`${file.name} loaded`);
      } catch (error) {
        this.logger.error(`Error loading ${file.name}: ${error}`);
      }
    }
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