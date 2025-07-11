import { Logger } from "@/core";
import { zetten } from "@/core/server";

async function main() {
  const app = await zetten({
    router: "fastify",
    logger: new Logger(),
    port: 3001,
    routesDir: "./example/sample/routes"
  });
  app.start();
}
main()