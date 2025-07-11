import { HandlerOptions } from "@/handler";
import { ZRouterContext } from "@/handler/types";

import { users } from "../../../db";

export const handler = async ({ response, request }: ZRouterContext<unknown, { id: string }>) => {
  const user = users.find(user => user.id === parseInt(request.params.id));
  if (user) {
    return response.json(user);
  } else {
    return response.status(404).json({ message: "user not found" });
  }
};

export const options: HandlerOptions = {
  schema: {

  }
}