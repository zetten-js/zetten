import { z } from 'zod';

import { HandlerOptions } from '@zetten/handler';

export default async function () {
  return "";
}

export const options: HandlerOptions = {
  schema: {
    params: z.object({ name: z.string() }),
  },
}