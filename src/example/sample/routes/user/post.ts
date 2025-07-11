import { HandlerOptions } from "@/handler";
import { EndpointHandler } from "@/handler/types";
import { z } from "zod";

export const handler: EndpointHandler = ({ request }) => {

}

export const options: HandlerOptions = {
  schema: {
    body: z.object({

    })
  }
}