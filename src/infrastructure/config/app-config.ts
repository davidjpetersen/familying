import { z } from 'zod'
import { ValidationResult } from '../../domain/types/result'

/**
 * Configuration interfaces
 */
export interface DatabaseConfig {
  readonly url: string
  readonly anonKey: string
  readonly serviceRoleKey: string
}

export interface AuthConfig {
  readonly publishableKey: string
  readonly secretKey: string
  readonly signInUrl: string
  readonly signUpUrl: string
  readonly afterSignInUrl: string
  readonly afterSignUpUrl: string
}

export interface PluginConfig {
  readonly enabled: boolean
  readonly discoveryPath: string
  readonly maxPlugins: number
  readonly timeoutMs: number
}

export interface MonitoringConfig {
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error'
  readonly enableMetrics: boolean
  readonly metricsPort?: number
}

export interface AppConfig {
  readonly database: DatabaseConfig
  readonly auth: AuthConfig
  readonly plugins: PluginConfig
  readonly monitoring: MonitoringConfig
  readonly environment: 'development' | 'production' | 'test'
}

/**
 * Configuration schemas for validation
 */
const databaseConfigSchema = z.object({
  url: z.string().url('Invalid database URL'),
  anonKey: z.string().min(1, 'Database anon key is required'),
  serviceRoleKey: z.string().min(1, 'Database service role key is required')
})

const authConfigSchema = z.object({
  publishableKey: z.string().min(1, 'Auth publishable key is required'),
  secretKey: z.string().min(1, 'Auth secret key is required'),
  signInUrl: z.string().default('/sign-in'),
  signUpUrl: z.string().default('/sign-up'),
  afterSignInUrl: z.string().default('/dashboard'),
  afterSignUpUrl: z.string().default('/dashboard')
})

const pluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  discoveryPath: z.string().default('./packages/services'),
  maxPlugins: z.number().int().min(1).default(50),
  timeoutMs: z.number().int().min(1000).default(30000)
})

const monitoringConfigSchema = z.object({
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  enableMetrics: z.boolean().default(false),
  metricsPort: z.number().int().min(1).max(65535).optional()
})

const appConfigSchema = z.object({
  database: databaseConfigSchema,
  auth: authConfigSchema,
  plugins: pluginConfigSchema,
  monitoring: monitoringConfigSchema,
  environment: z.enum(['development', 'production', 'test']).default('development')
})

/**
 * Environment variable loader
 */
export class EnvironmentConfigLoader {
  load(): Record<string, any> {
    return {
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      auth: {
        publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
        signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
        signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
        afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
        afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard'
      },
      plugins: {
        enabled: process.env.PLUGINS_ENABLED !== 'false',
        discoveryPath: process.env.PLUGINS_DISCOVERY_PATH || './packages/services',
        maxPlugins: parseInt(process.env.PLUGINS_MAX_COUNT || '50'),
        timeoutMs: parseInt(process.env.PLUGINS_TIMEOUT_MS || '30000')
      },
      monitoring: {
        logLevel: process.env.LOG_LEVEL || 'info',
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        metricsPort: process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT) : undefined
      },
      environment: process.env.NODE_ENV || 'development'
    }
  }
}

/**
 * Configuration validator
 */
export class ConfigValidator {
  validate(rawConfig: Record<string, any>): { 
    isValid: boolean
    config?: AppConfig
    errors?: string[] 
  } {
    try {
      const config = appConfigSchema.parse(rawConfig)
      return { isValid: true, config }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        )
        return { isValid: false, errors }
      }
      
      return { 
        isValid: false, 
        errors: ['Unknown configuration validation error'] 
      }
    }
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Configuration validation failed: ${errors.join(', ')}`)
    this.name = 'ConfigurationError'
  }
}

/**
 * Main configuration class (Singleton)
 */
export class AppConfiguration {
  private static instance: AppConfiguration
  
  private constructor(
    public readonly config: AppConfig
  ) {}

  static create(): AppConfiguration {
    if (!AppConfiguration.instance) {
      const loader = new EnvironmentConfigLoader()
      const validator = new ConfigValidator()
      
      const rawConfig = loader.load()
      const validation = validator.validate(rawConfig)
      
      if (!validation.isValid || !validation.config) {
        throw new ConfigurationError(validation.errors || ['Unknown validation error'])
      }

      AppConfiguration.instance = new AppConfiguration(validation.config)
    }
    
    return AppConfiguration.instance
  }

  // Convenience getters
  get database(): DatabaseConfig {
    return this.config.database
  }

  get auth(): AuthConfig {
    return this.config.auth
  }

  get plugins(): PluginConfig {
    return this.config.plugins
  }

  get monitoring(): MonitoringConfig {
    return this.config.monitoring
  }

  get environment(): string {
    return this.config.environment
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development'
  }

  isProduction(): boolean {
    return this.config.environment === 'production'
  }

  isTest(): boolean {
    return this.config.environment === 'test'
  }

  // For testing - reset singleton
  static reset(): void {
    AppConfiguration.instance = undefined as any
  }
}
