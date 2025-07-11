import z from "zod";

export const middlewareOptions = z.object({
  ignore: z.boolean().default(false).optional(),
  name: z.string()
})
export const middlewareSchema = z.object({
  middleware: z.function().returns(z.any()),
  options: middlewareOptions
});

export const middlewareModuleSchema = z.object({
  middleware: z.union([
    middlewareSchema,
    middlewareSchema.array()
  ])
});
export type MiddlewareModule = z.infer<typeof middlewareModuleSchema>;

export const handlerOptionsSchema = z.object({
  ignore: z.boolean().default(false).optional(),
  schema: z.object({
    body: z.any().optional(),
    query: z.any().optional(),
    params: z.any().optional(),
    response: z.record(
      z.number().int().positive(),
      z.any()
    ).optional()
  }),
  config: z.object({
    rateLimit: z.object({
      max: z.number().int().positive(),
      timeWindow: z.string().or(z.number())
    }).optional()
  }).optional()
});

export type HandlerOptions = z.infer<typeof handlerOptionsSchema>;

export const handlerSchema = z.object({
  handler: z.function(),
  options: handlerOptionsSchema,
  middlewares: middlewareSchema.optional(),
})

export type Handler = z.infer<typeof handlerSchema>;