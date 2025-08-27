import { z } from 'zod'

export const ConfigSchema = z.object({
  FEATURE_ENABLED: z.boolean().default(true),
  LIMIT: z.number().int().positive().default(100),
  // Add your config schema here
})

export type Config = z.infer<typeof ConfigSchema>

export const defaultConfig: Config = {
  FEATURE_ENABLED: true,
  LIMIT: 100
}
