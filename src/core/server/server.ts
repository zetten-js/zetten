import { handlerPlugin } from "@/handler";
import { Router } from "@/handler/types";

import { Logger } from "../logger";
import { Plugin } from "../plugin";

import { ServerConfig, ZContext } from "./types";

export class Zetten<T extends ZContext> {
  private router!: Router;
  private context: T;
  private logger: Logger = new Logger(Zetten.name);
  private plugins: Plugin<T, any>[] = [];

  constructor(private config: ServerConfig, router: Router) {
    this.router = router;
    this.context = {} as T;
  }

  public registerPlugin<U extends ZContext>(plugin: Plugin<T, U>): Zetten<T & U> {
    this.plugins.push(plugin);
    return this as unknown as Zetten<T & U>;
  }

  public async start(port?: number): Promise<void> {
    for (const plugin of this.plugins) {
      const newContextPart = await plugin(this);
      this.context = { ...this.context, ...newContextPart };
    }
    this.router.listen(port || this.config.port || 3000);
    this.logger.info(`Server running on port ${port || this.config.port}`);
  }

  getRouter(): Router {
    return this.router;
  }
}

export async function zetten<AdapterOpts>(config: ServerConfig, opts?: AdapterOpts) {
  const routerAdapter = await import(`./adapter/${config.router}`);
  const router: Router = routerAdapter.adapter(opts);
  const zetten = new Zetten(config, router);
  zetten.registerPlugin(handlerPlugin(config.routesDir || "./routes"))
  return zetten;
}