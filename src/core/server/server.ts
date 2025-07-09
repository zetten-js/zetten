import { handlerPlugin } from "@/handler";

import { Logger } from "../logger";
import { Plugin } from "../plugin";

import { IServerAdapter, ServerConfig } from "./types";

export class Zetten<T = {}> {
  private serverAdapter: IServerAdapter;
  private context: T;
  private logger: Logger = new Logger(Zetten.name);
  private plugins: Plugin<T, any>[] = [];

  constructor(private config: ServerConfig) {
    this.serverAdapter = config.adapter;
    this.context = {} as T;
  }

  public registerPlugin<U>(plugin: Plugin<T, U>): Zetten<T & U> {
    this.plugins.push(plugin);
    return this as unknown as Zetten<T & U>;
  }

  public async start(port?: number): Promise<void> {
    for (const plugin of this.plugins) {
      const newContextPart = await plugin(this);
      this.context = { ...this.context, ...newContextPart };
    }
    await this.serverAdapter.listen(port || this.config.port || 3000);
    this.logger.info(`Server running on port ${port || this.config.port}`);
  }

  getServerAdapter(): IServerAdapter {
    return this.serverAdapter;
  }
}

export function zetten(config: ServerConfig) {
  return new Zetten(config).registerPlugin(handlerPlugin(config.routesDir || "./routes"));
}