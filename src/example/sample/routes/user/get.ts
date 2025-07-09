import { HandlerOptions } from "@/handler";

export const handler = async (req: any, res: any) => {
  res.send("get User!");
};

export const options: HandlerOptions = {
  schema: {

  }
}