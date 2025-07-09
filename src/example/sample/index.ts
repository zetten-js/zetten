import { Logger } from "@/core";
import { zetten } from "@/core/server";
import { fastifyAdapter } from "@/core/server/adapter/fastify";
import fastify from "fastify";

zetten({
  adapter: fastifyAdapter(fastify()),
  logger: new Logger(),
  port: 3001,
  routesDir: "./example/sample/routes"
}).start();
