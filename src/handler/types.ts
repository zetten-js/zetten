import { ZContext } from "@/core";

export type HttpHeaders = Record<string, string | string[] | number | undefined>;
export type HttpQuery = Record<string, string | string[] | undefined>;
export type HttpParams = Record<string, string>;
export type HttpBody = unknown;

export interface ZRequest<B = HttpBody, P = HttpParams, Q = HttpQuery> {
  body: B;
  params: P;
  query: Q;
  headers: HttpHeaders;
  method: string;
  url: string;
  originalRequest?: unknown;
  getHeader(name: string): string | string[] | number | undefined;
  getCookies<TValue = unknown>(name: string): TValue | undefined;
}

export interface ZResponse {
  status(code: number): this;
  send(body: unknown): this;
  json(body: unknown): this;
  setHeader(name: string, value: string | string[]): this;
  getHeader(name: string): string | string[] | number | undefined;
  getHeaders(): HttpHeaders;
  originalResponse?: unknown;
}
export interface ZRouterContext<B = HttpBody, P = HttpParams, Q = HttpQuery> extends ZContext {
  request: ZRequest<B, P, Q>;
  response: ZResponse;
}

export type EndpointHandler<C = ZRouterContext> = (context: C) => Promise<unknown> | unknown;

export type MiddlewareHandler<C = ZRouterContext> = (context: C) => Promise<ZResponse | void> | ZResponse | void;

export type Middleware<C = ZRouterContext> = {
  middleware: MiddlewareHandler<C>;
  options: {
    name: string;
    ignore?: boolean;
  }
}

export const HTTP_METHODS = ["get", "post", "put", "delete", "patch"] as const;

export type AddRouteOptions = {
  path: string;
  method: "get" | "post" | "put" | "patch" | "delete";
  handler: EndpointHandler;
  middlewares: MiddlewareHandler[] | MiddlewareHandler | undefined;
}

export type Router = {
  listen(port: number): void
  addRoute(opts: AddRouteOptions): void
}
export type RouterBuilder<Args = any> = (ctx: ZContext, args?: Args) => Router;