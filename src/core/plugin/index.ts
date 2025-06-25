import { Zetten } from '../server';

export interface Plugin {
  init(zetten: Zetten): void | Promise<void>;
}