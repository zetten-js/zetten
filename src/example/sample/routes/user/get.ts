import { HandlerOptions } from "@/handler";
import { ZRouterContext } from "@/handler/types";

import { users } from "../../db";

export const handler = async ({ response }: ZRouterContext) => {
  response.json(users);
};

export const options: HandlerOptions = {
  schema: {

  }
}