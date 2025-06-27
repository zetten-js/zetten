import z from 'zod';

export const bootstrapOptions = z.object({
  onError: z.literal("continue").or(z.literal("stop")).default("continue").optional(),
  order: z.number().int().positive().optional()
});

export type BootstrapOptions = z.infer<typeof bootstrapOptions>;

export const bootstrapSchema = z.object({
  fn: z.function(),
  options: bootstrapOptions,
  ignore: z.boolean().default(false).optional()
});

export type Bootstrap = z.infer<typeof bootstrapSchema>;