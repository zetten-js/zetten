import { Zetten } from "../server";

export type Plugin<T, U> = (zetten: Zetten<T>) => U | void | Promise<U | void>;
