import fastify, { FastifyInstance } from "fastify";

import { IServerAdapter } from "../../types";

export class FastifyAdapter implements IServerAdapter {
  constructor(private instance: FastifyInstance = fastify()) {}

  async listen(port: number): Promise<void> {
    await this.instance.listen({ port });
  }

  addRoute(method: string, path: string, handler: any): void {
    this.instance.route({
      method,
      url: path,
      handler,
    })
  }
}

export const fastifyAdapter = (fastify?: FastifyInstance) => new FastifyAdapter(fastify);