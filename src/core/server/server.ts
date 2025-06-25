import { Logger } from '../logger';
import { Plugin } from '../plugin';
import { IServerAdapter, ServerConfig } from './types';

export class Zetten {
  private plugins: Plugin[] = [];
  private serverAdapter: IServerAdapter;
  private logger: Logger;

  constructor(private config: ServerConfig) {
    this.serverAdapter = config.adapter;
    this.logger = config.logger || console;
  }

  public registerPlugin(manager: Plugin): this {
    this.plugins.push(manager);
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
    for (const manager of this.plugins) {
      if (manager) {
        await manager.init(this);
      }
    }
  }


}