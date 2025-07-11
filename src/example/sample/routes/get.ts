import { HandlerOptions } from "@/handler";
import { ZRouterContext } from "@/handler/types";

export const handler = async ({ response }: ZRouterContext) => {
  response.json({ message: "Hello World!" });
};

export const options: HandlerOptions = {
  schema: {

  }
}