import { defaultExt, Logger, Plugin, ZContext, Zetten } from "@/core";
import { Loader } from "@/core/loader";
import { toArray } from "@/utils";
import path from "path";
import { z, ZodError } from "zod";

import { Handler, handlerSchema, MiddlewareModule, middlewareModuleSchema, middlewareSchema } from "./schema";
import { EndpointHandler, HTTP_METHODS, Middleware } from "./types";

const defaultPatterns = HTTP_METHODS.map((method) => `**/${method}.${defaultExt}`);

const logger = new Logger("HANDLER PLUGIN");

async function findMiddlewares(baseDir: string, routePath: string): Promise<z.infer<typeof middlewareSchema>[]> {
  const middlewares: z.infer<typeof middlewareSchema>[] = [];

  const splittedPath = routePath.split("/");
  for (let i = 0; i < splittedPath.length; i++) {
    let currentDir = path.join(baseDir, ...splittedPath.filter((_, index) => index < i))

    try {
      const files = await Loader.load<MiddlewareModule>(currentDir, middlewareModuleSchema, `middleware.${defaultExt}`);

      files.forEach(file => {
        const middlewaresList = toArray(file.module.middleware);
        for (const middleware of middlewaresList) {
          if (middleware.options.ignore) {
            logger.info(`Ignoring middleware: ${file.name}`);
            continue;
          }
          middlewares.push(middleware);
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error(`Invalid middleware options on ${currentDir}: ${error.message}`);
      } else {
        logger.error(`Invalid middleware on ${currentDir}: ${error}`);
      }
    }
  }
  return middlewares;
}

function segmentToRoute(seg: string): string {
  if (seg.startsWith("[") && seg.endsWith("]")) return `:${seg.slice(1, -1)}`;
  return seg;
}

function buildRouteFromPath(fullPath: string, baseDir: string): string {
  const fullParts = path.normalize(fullPath).split(/[\\/]/);
  const baseParts = path.normalize(baseDir).split(/[\\/]/);

  let startIndex = -1;
  for (let i = 0; i < fullParts.length; i++) {
    if (fullParts.slice(i, i + baseParts.length).join('/') === baseParts.join('/')) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    throw new Error(`Base directory "${baseDir}" not found in path "${fullPath}"`);
  }

  const differenceParts = fullParts.slice(startIndex + baseParts.length);

  const routeParts = [...differenceParts];

  const routeSegments = routeParts.map(segmentToRoute);
  return '/' + routeSegments.filter(Boolean).join('/');
}

async function readFrom(baseDir: string, ...pattern: string[]) {
  const handlers: Array<{
    path: string,
    method: typeof HTTP_METHODS[number],
    handler: EndpointHandler,
    middlewares: Middleware[]
  }> = [];

  if (!pattern.length) pattern = defaultPatterns;

  const files = await Loader.load<Handler>(baseDir, handlerSchema, ...pattern);
  await Promise.all(files.map(async (file) => {
    const routePath = buildRouteFromPath(file.path, baseDir);
    if (file.module.options.ignore) {
      logger.info(`Ignoring handler: ${routePath}`);
      return;
    }

    const middlewares = await findMiddlewares(baseDir, routePath);

    if (file.module.middlewares) {
      const handlerMiddlewares = toArray(file.module.middlewares);

      middlewares.push(...handlerMiddlewares);
    }
    const filteredMiddlewares = middlewares.filter(Boolean);
    handlers.push({
      ...file.module,
      method: file.name.split('.')[0] as typeof HTTP_METHODS[number],
      path: routePath,
      middlewares: filteredMiddlewares,
    });
  }));
  return handlers;
}

const formatPath = (path: string) => {
  const splittedPath = path.split('/');
  splittedPath.pop();
  const formattedPath = splittedPath.join('/');
  return formattedPath.length > 0 ? formattedPath : '/';
}

const printHandler = (
  handler: {
    path: string,
    method: typeof HTTP_METHODS[number],
    handler: EndpointHandler,
    middlewares: Middleware[]
  }
) => {
  const method = handler.method.toUpperCase()
  const path = formatPath(handler.path);
  const middlewares = handler.middlewares.length > 0 ?
    `(${handler.middlewares.map(m => m.options.name).join(" > ")}) ` : ""
  logger.info(`Registering handler: [${method}] ${middlewares}${path}`);
}

export const handlerPlugin = (baseDir: string): Plugin<ZContext, Promise<void>> => {
  return async (zetten: Zetten<ZContext>): Promise<void> => {
    const handlers = await readFrom(baseDir, ...defaultPatterns);

    logger.info(`Found ${handlers.length} handlers`);
    const server = zetten.getRouter();
    handlers.forEach(handler => {
      printHandler(handler);
      server.addRoute({
        method: handler.method,
        path: formatPath(handler.path),
        handler: handler.handler,
        middlewares: handler.middlewares.map(({ middleware }) => middleware)
      });
    })
  }
}