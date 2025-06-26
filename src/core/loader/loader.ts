import fastGlob from 'fast-glob';
import path from 'path';
import { z } from 'zod';

export interface LoadedFile<T> {
  path: string;
  name: string;
  module: T;
}
export interface LoadedFileWithSkip<T> extends LoadedFile<T> {
  skip?: boolean;
}
export class Loader {
  static async load<T>(
    baseDir: string,
    schema: z.ZodType<T>,
    ...patterns: string[]
  ): Promise<LoadedFile<T>[]> {
    if (patterns.length === 0) {
      patterns = ['**/*.js', '**/*.ts'];
    }
    const files = await fastGlob(patterns, {
      cwd: path.resolve(process.cwd(), baseDir),
      absolute: true,
    });
    
    const results = await Promise.all(
      files.map(async (filePath): Promise<LoadedFileWithSkip<T>> => {
        const parsed = path.parse(filePath);
        
        try {
          const module = schema.parse(await import(filePath));         
          return {
            path: filePath,
            name: parsed.name,
            module: module,
            skip: false
          };
        } catch (error) {
          console.error(`Error importing file ${filePath}:`, error);
          return {
            module: {} as T,
            path: filePath,
            name: parsed.name,
            skip: true
          };
        }
      })
    );

    return results.filter((result) => !result.skip) as LoadedFile<T>[];
  }
}