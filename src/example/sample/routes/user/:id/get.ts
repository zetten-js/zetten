import { HandlerOptions } from "@/handler";

export const handler = async (req: any, res: any) => {
  res.send("Hello World!");
};

export const options: HandlerOptions = {
  schema: {

  }
}