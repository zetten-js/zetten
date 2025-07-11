import { ZContext, Zetten } from "../server";

export type Plugin<
  T extends ZContext = {},
  U extends ZContext = {}
> = (zetten: Zetten<T>) => U | void | Promise<U | void>;
