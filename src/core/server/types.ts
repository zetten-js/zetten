import { Logger } from "../logger";

export interface ServerConfig {
  port?: number;
  logger?: Logger;
  routesDir?: string;
  router?: "fastify"
}

export type ZContext = {}