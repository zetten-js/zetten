import {
  HttpParams, HttpQuery, Router, RouterBuilder, ZRequest, ZResponse, ZRouterContext
} from "@/handler/types";
import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ZContext } from "../../types";

const createZRequest = (req: FastifyRequest): ZRequest => {
  return {
    ...req,
    originalRequest: req,
    getHeader: (name) => req.headers[name],
    getCookies: <T = unknown>() => "req.headers.cookie" as T,
    params: req.params as HttpParams,
    query: req.query as HttpQuery
  }
}

function createZResponse(res: FastifyReply): ZResponse {
  const response: ZResponse = {
    status: (code) => {
      res.code(code)
      return response
    },
    send: (body) => {
      res.send(body)
      return response
    },
    json: (body) => {
      res.send(body)
      return response
    },
    setHeader: (name, value) => {
      res.header(name, value)
      return response
    },
    getHeader: (name) => res.getHeaders()[name],
    getHeaders: () => res.getHeaders(),
    originalResponse: res
  }
  return response;
}

function createZRouterContext(ctx: ZContext, req: FastifyRequest, res: FastifyReply): ZRouterContext {
  return {
    ...ctx,
    request: createZRequest(req),
    response: createZResponse(res)
  }
}

export const adapter: RouterBuilder<FastifyInstance> = (ctx: ZContext, instance: FastifyInstance = fastify()): Router => {
  return {
    listen: port => instance.listen({ port }),
    addRoute: ({ handler, method, middlewares, path }) => {
      instance.route({
        method,
        url: path,
        handler: (req, reply) => handler(createZRouterContext(ctx, req, reply)),
        preHandler: Array.isArray(middlewares) ?
          middlewares.map(middleware =>
            async (req: FastifyRequest, reply: FastifyReply) => {
              await middleware(createZRouterContext(ctx, req, reply));
            }
          ) : middlewares ?
          async (req: FastifyRequest, reply: FastifyReply) => {
            await middlewares(createZRouterContext(ctx, req, reply));
          } : undefined
      })
    }
  }
}