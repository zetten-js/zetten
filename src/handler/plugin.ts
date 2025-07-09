import { defaultExt, Logger, Plugin, Zetten } from "@/core";
import { Loader } from "@/core/loader";
import path from "path";
import { ZodError } from "zod";

import { Handler, handlerSchema, Middleware, middlewareSchema } from "./schema";

const HTTP_METHODS = ["get", "post", "put", "delete", "patch"] as const;
const defaultPatterns = HTTP_METHODS.map((method) => `**/${method}.${defaultExt}`);

const logger = new Logger("HANDLER PLUGIN");

async function findMiddlewares(routeDir: string, baseDir: string): Promise<Middleware[]> {
  const middlewares: Middleware[] = [];
  let currentDir = routeDir;
  while (currentDir.startsWith(baseDir)) {
    try {
      const files = await Loader.load<Middleware>(currentDir, middlewareSchema, `**/middleware.${defaultExt}`);
      files.forEach(file => {
        if (file.module.ignore) {
          logger.info(`Ignoring middleware: ${file.name}`);
          return;
        }
        middlewares.push(file.module);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error(`Invalid middleware options on ${currentDir}: ${error.message}`);
      } else {
        logger.error(`Invalid middleware on ${currentDir}: ${error}`);
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  return middlewares;
}

function segmentToRoute(seg: string): string {
  if (seg.startsWith("[...") && seg.endsWith("]")) return "*";
  if (seg.startsWith("[") && seg.endsWith("]")) return `:${seg.slice(1, -1)}`;
  return seg;
}

// function buildRouteFromPath(fullPath: string, baseDir: string): string {
//   const normalizedFullPath = path.normalize(fullPath);
//   const normalizedBaseDir = path.normalize(baseDir);
//   console.log(normalizedBaseDir, normalizedFullPath);

//   const relative = path.relative(baseDir, fullPath);
//   const segments = relative.split(path.sep).slice(0, -1);
//   const routeSegments = segments.map(segmentToRoute);
//   return "/" + routeSegments.filter(Boolean).join("/");
// }

function buildRouteFromPath(fullPath: string, baseDir: string): string {
  // Normaliza e divide os caminhos em partes
  const fullParts = path.normalize(fullPath).split(/[\\/]/);
  const baseParts = path.normalize(baseDir).split(/[\\/]/);

  // Encontra onde o baseDir começa no fullPath
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

  // Pega as partes após o baseDir
  const differenceParts = fullParts.slice(startIndex + baseParts.length);

  // Remove a extensão do arquivo final
  const lastPart = differenceParts.pop()?.replace(/\.[^/.]+$/, '') || '';
  const routeParts = [...differenceParts, lastPart];

  // Processa cada segmento e monta a rota
  const routeSegments = routeParts.map(segmentToRoute).map(segment => segment.split(path.sep).slice(0, -1));
  return '/' + routeSegments.filter(Boolean).join('/');
}
async function readFrom(baseDir: string, ...pattern: string[]) {
  const handlers: Array<Handler & { path: string, method: typeof HTTP_METHODS[number] }> = [];

  if (!pattern.length) pattern = defaultPatterns;

  const files = await Loader.load<Handler>(baseDir, handlerSchema, ...pattern);
  logger.info(baseDir);
  files.forEach(async (file) => {
    const routePath = buildRouteFromPath(file.path, baseDir);
    if (file.module.ignore) {
      logger.info(`Ignoring handler: ${routePath}`);
      return;
    }

    const pathMiddlewares = await findMiddlewares(file.path, baseDir);

    const pathMiddlewareFns = pathMiddlewares.flatMap(m =>
      Array.isArray(m.middleware) ? m.middleware : [m.middleware]
    );
    let allMiddlewares = [...pathMiddlewareFns];
    if (file.module.middlewares) {
      const handlerMiddlewares = Array.isArray(file.module.middlewares)  ? file.module.middlewares : [file.module.middlewares];

      allMiddlewares.push(...handlerMiddlewares);
    }
    const filteredMiddlewares = allMiddlewares.filter(m => m !== undefined);
    handlers.push({
      ...file.module,
      method: file.name.split('.')[0] as typeof HTTP_METHODS[number],
      path: routePath,
      middlewares: filteredMiddlewares.length > 0 ? filteredMiddlewares : undefined,
    });
  });
  return handlers;
}

export const handlerPlugin = (baseDir: string): Plugin<{}, Promise<void>> => {
  return async (zetten: Zetten): Promise<void> => {
    const handlers = await readFrom(baseDir, ...defaultPatterns);

    logger.info(`Found ${handlers.length} handlers`);
    const server = zetten.getServerAdapter();
    handlers.forEach(handler => {
      logger.info(`Registering handler: ${handler.path}`);

      server.addRoute(handler.method, handler.path, handler.handler);
    })
  }
}