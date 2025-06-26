import path from 'path';
import { ZodError } from 'zod';

import { Loader } from '@zetten/core/loader';
import { Logger } from '@zetten/core/logger';
import { defaultExt } from '@zetten/core/mode';
import { Plugin } from '@zetten/core/plugin';
import { Zetten } from '@zetten/core/server';

import { Handler, handlerSchema, Middleware, middlewareSchema } from './schema';

const HTTP_METHODS = ["get", "post", "put", "delete", "patch"] as const;
const defaultPatterns = HTTP_METHODS.map((method) => `**/${method}.handler.${defaultExt}`);

export class HandlerPlugin implements Plugin {
  private handlers: Array<Handler & { path: string, method: typeof HTTP_METHODS[number] }> = [];
  constructor(private baseDir: string = "./routes", private logger: Logger = console) { }
  
  async init(zetten: Zetten): Promise<void> {
    await this.readFrom(this.baseDir, ...defaultPatterns);
    
    this.logger.info(`Found ${this.handlers.length} handlers`);
    const server = zetten.getServerAdapter();
    this.handlers.forEach(handler => {
      server.addRoute(handler.method, handler.path, handler.handler);
    })
  }

  private async findMiddlewares(routeDir: string, baseDir: string): Promise<Middleware[]> {
    const middlewares: Middleware[] = [];
    let currentDir = routeDir;

    while (currentDir.startsWith(baseDir)) {      
      try {
        const files = await Loader.load<Middleware>(currentDir, middlewareSchema, `**/*.middleware.${defaultExt}`);
        files.forEach(file => {
          if (file.module.ignore) {
            this.logger.info(`Ignoring middleware: ${file.name}`);
            return;
          }
          middlewares.push(file.module);
        });
      } catch (error) { 
        if (error instanceof ZodError) {
          this.logger.error(`Invalid middleware options on ${currentDir}: ${error.message}`);
        } else {
          this.logger.error(`Invalid middleware on ${currentDir}: ${error}`);
        }
      }
  
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break;
      currentDir = parentDir;
    }
    return middlewares;
  }
  private segmentToRoute(seg: string): string {
    if (seg.startsWith("[...") && seg.endsWith("]")) return "*";
    if (seg.startsWith("[") && seg.endsWith("]")) return `:${seg.slice(1, -1)}`;
    return seg;
  }
  private buildRouteFromPath(fullPath: string, baseDir: string): string {
    const relative = path.relative(baseDir, fullPath);
    const segments = relative.split(path.sep).slice(0, -1);
    const routeSegments = segments.map(this.segmentToRoute);
    return "/" + routeSegments.filter(Boolean).join("/");
  }
  
  async readFrom(baseDir: string, ...pattern: string[]) {
    if (!pattern.length) pattern = defaultPatterns;
    
    const files = await Loader.load<Handler>(baseDir, handlerSchema, ...pattern);
    files.forEach(async (file) => {
      const routePath = this.buildRouteFromPath(file.path, baseDir);
      if (file.module.ignore) {
        this.logger.info(`Ignoring handler: ${routePath}`);
        return;
      }

      const pathMiddlewares = await this.findMiddlewares(file.path, baseDir);

      const pathMiddlewareFns = pathMiddlewares.flatMap(m => 
        Array.isArray(m.middleware) ? m.middleware : [m.middleware]
      );
      let allMiddlewares = [...pathMiddlewareFns];
      if (file.module.middlewares) {
        const handlerMiddlewares = Array.isArray(file.module.middlewares)  ? file.module.middlewares : [file.module.middlewares];
        
        allMiddlewares.push(...handlerMiddlewares);
      }
      const filteredMiddlewares = allMiddlewares.filter(m => m !== undefined);
      this.handlers.push({
        ...file.module,
        method: file.name.split('.')[0] as typeof HTTP_METHODS[number],
        path: routePath,
        middlewares: filteredMiddlewares.length > 0 ? filteredMiddlewares : undefined,
      });
      this.logger.info(`Registered handler: ${routePath}`);
    });
  }
}