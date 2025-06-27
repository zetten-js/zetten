
import { HandlerPlugin } from '@/handler';

import { Logger } from '../logger';
import { Plugin } from '../plugin';
import { IServerAdapter, ServerConfig } from './types';

export class Zetten {
  private plugins: Plugin[] = [];
  private serverAdapter: IServerAdapter;
  private logger: Logger = new Logger(Zetten.name);

  constructor(private config: ServerConfig) {
    this.serverAdapter = config.adapter;
    this.plugins.push(new HandlerPlugin(config.routesDir));
  }

  public registerPlugin(plugin: Plugin): this {
    this.plugins.push(plugin);
    return this;
  }

  public async start(port?: number): Promise<void> {
    await this.initializePlugins();
    
    await this.serverAdapter.listen(port || this.config.port || 3000);
    this.logger.info(`Server running on port ${port || this.config.port}`);
  }

  getServerAdapter(): IServerAdapter {
    return this.serverAdapter;
  }

  private async initializePlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin) {
        await plugin.init(this);
      }
    }
  }
}