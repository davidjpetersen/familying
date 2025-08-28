/**
 * Configuration management for Soundscapes plugin
 * Provides type-safe configuration with environment-specific overrides
 */

import { z } from 'zod'

// Configuration schema with validation
const ConfigSchema = z.object({
  // Database configuration
  database: z.object({
    maxConnections: z.number().min(1).max(100).default(20),
    connectionTimeout: z.number().min(1000).default(30000),
    queryTimeout: z.number().min(1000).default(60000),
    retryAttempts: z.number().min(0).max(5).default(3),
    retryDelay: z.number().min(100).default(1000),
  }),

  // Storage configuration
  storage: z.object({
    bucket: z.string().default('plugin_soundscapes'),
    maxFileSize: z.number().min(1024).default(52428800), // 50MB
    allowedMimeTypes: z.array(z.string()).default([
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 
      'audio/ogg', 'audio/flac', 'image/jpeg', 'image/png', 'image/webp'
    ]),
    uploadTimeout: z.number().min(5000).default(300000), // 5 minutes
  }),

  // Cache configuration
  cache: z.object({
    soundscapes: z.object({
      ttl: z.number().min(60).default(300), // 5 minutes
      maxSize: z.number().min(10).default(1000),
    }),
    categories: z.object({
      ttl: z.number().min(300).default(1800), // 30 minutes
      maxSize: z.number().min(5).default(50),
    }),
    storage: z.object({
      ttl: z.number().min(60).default(600), // 10 minutes
      maxSize: z.number().min(50).default(500),
    }),
  }),

  // Rate limiting
  rateLimiting: z.object({
    enabled: z.boolean().default(true),
    windowMs: z.number().min(1000).default(60000), // 1 minute
    maxRequests: z.object({
      anonymous: z.number().min(1).default(10),
      authenticated: z.number().min(1).default(100),
      admin: z.number().min(1).default(1000),
    }),
  }),

  // Security configuration
  security: z.object({
    jwtSecret: z.string().min(32),
    sessionTimeout: z.number().min(300).default(3600), // 1 hour
    maxLoginAttempts: z.number().min(3).default(5),
    lockoutDuration: z.number().min(300).default(900), // 15 minutes
    requireHttps: z.boolean().default(true),
    corsOrigins: z.array(z.string()).default(['https://familying.org']),
  }),

  // Performance monitoring
  monitoring: z.object({
    enabled: z.boolean().default(true),
    metricsRetention: z.number().min(86400).default(604800), // 7 days
    slowQueryThreshold: z.number().min(100).default(1000), // 1 second
    errorNotificationThreshold: z.number().min(1).default(10),
  }),

  // Feature flags
  features: z.object({
    storageImport: z.boolean().default(true),
    categoryFiltering: z.boolean().default(true),
    advancedSearch: z.boolean().default(false),
    batchOperations: z.boolean().default(false),
  }),

  // Environment
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Logging
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    structured: z.boolean().default(true),
    includeStackTrace: z.boolean().default(false),
  }),
})

export type SoundscapesConfig = z.infer<typeof ConfigSchema>

/**
 * Load and validate configuration from environment variables and defaults
 */
function loadConfig(): SoundscapesConfig {
  const config = {
    database: {
      maxConnections: parseInt(process.env.SOUNDSCAPES_DB_MAX_CONNECTIONS || '20'),
      connectionTimeout: parseInt(process.env.SOUNDSCAPES_DB_CONNECTION_TIMEOUT || '30000'),
      queryTimeout: parseInt(process.env.SOUNDSCAPES_DB_QUERY_TIMEOUT || '60000'),
      retryAttempts: parseInt(process.env.SOUNDSCAPES_DB_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.SOUNDSCAPES_DB_RETRY_DELAY || '1000'),
    },
    storage: {
      bucket: process.env.SOUNDSCAPES_STORAGE_BUCKET || 'plugin_soundscapes',
      maxFileSize: parseInt(process.env.SOUNDSCAPES_MAX_FILE_SIZE || '52428800'),
      allowedMimeTypes: process.env.SOUNDSCAPES_ALLOWED_MIME_TYPES?.split(',') || undefined,
      uploadTimeout: parseInt(process.env.SOUNDSCAPES_UPLOAD_TIMEOUT || '300000'),
    },
    cache: {
      soundscapes: {
        ttl: parseInt(process.env.SOUNDSCAPES_CACHE_TTL || '300'),
        maxSize: parseInt(process.env.SOUNDSCAPES_CACHE_MAX_SIZE || '1000'),
      },
      categories: {
        ttl: parseInt(process.env.SOUNDSCAPES_CATEGORIES_CACHE_TTL || '1800'),
        maxSize: parseInt(process.env.SOUNDSCAPES_CATEGORIES_CACHE_MAX_SIZE || '50'),
      },
      storage: {
        ttl: parseInt(process.env.SOUNDSCAPES_STORAGE_CACHE_TTL || '600'),
        maxSize: parseInt(process.env.SOUNDSCAPES_STORAGE_CACHE_MAX_SIZE || '500'),
      },
    },
    rateLimiting: {
      enabled: process.env.SOUNDSCAPES_RATE_LIMITING_ENABLED !== 'false',
      windowMs: parseInt(process.env.SOUNDSCAPES_RATE_LIMIT_WINDOW || '60000'),
      maxRequests: {
        anonymous: parseInt(process.env.SOUNDSCAPES_RATE_LIMIT_ANON || '10'),
        authenticated: parseInt(process.env.SOUNDSCAPES_RATE_LIMIT_AUTH || '100'),
        admin: parseInt(process.env.SOUNDSCAPES_RATE_LIMIT_ADMIN || '1000'),
      },
    },
    security: {
      jwtSecret: process.env.SOUNDSCAPES_JWT_SECRET || process.env.JWT_SECRET || '',
      sessionTimeout: parseInt(process.env.SOUNDSCAPES_SESSION_TIMEOUT || '3600'),
      maxLoginAttempts: parseInt(process.env.SOUNDSCAPES_MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.SOUNDSCAPES_LOCKOUT_DURATION || '900'),
      requireHttps: process.env.NODE_ENV === 'production',
      corsOrigins: process.env.SOUNDSCAPES_CORS_ORIGINS?.split(',') || undefined,
    },
    monitoring: {
      enabled: process.env.SOUNDSCAPES_MONITORING_ENABLED !== 'false',
      metricsRetention: parseInt(process.env.SOUNDSCAPES_METRICS_RETENTION || '604800'),
      slowQueryThreshold: parseInt(process.env.SOUNDSCAPES_SLOW_QUERY_THRESHOLD || '1000'),
      errorNotificationThreshold: parseInt(process.env.SOUNDSCAPES_ERROR_THRESHOLD || '10'),
    },
    features: {
      storageImport: process.env.SOUNDSCAPES_FEATURE_STORAGE_IMPORT !== 'false',
      categoryFiltering: process.env.SOUNDSCAPES_FEATURE_CATEGORY_FILTERING !== 'false',
      advancedSearch: process.env.SOUNDSCAPES_FEATURE_ADVANCED_SEARCH === 'true',
      batchOperations: process.env.SOUNDSCAPES_FEATURE_BATCH_OPERATIONS === 'true',
    },
    environment: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
    logging: {
      level: (process.env.SOUNDSCAPES_LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
      structured: process.env.SOUNDSCAPES_LOG_STRUCTURED !== 'false',
      includeStackTrace: process.env.SOUNDSCAPES_LOG_STACK_TRACE === 'true',
    },
  }

  // Validate configuration
  const result = ConfigSchema.safeParse(config)
  
  if (!result.success) {
    console.error('Invalid soundscapes configuration:', result.error.format())
    throw new Error(`Invalid soundscapes configuration: ${result.error.message}`)
  }

  return result.data
}

// Singleton configuration instance
let configInstance: SoundscapesConfig | null = null

export function getConfig(): SoundscapesConfig {
  if (!configInstance) {
    configInstance = loadConfig()
  }
  return configInstance
}

// Typed configuration access helpers
export const config = {
  get database() { return getConfig().database },
  get storage() { return getConfig().storage },
  get cache() { return getConfig().cache },
  get rateLimiting() { return getConfig().rateLimiting },
  get security() { return getConfig().security },
  get monitoring() { return getConfig().monitoring },
  get features() { return getConfig().features },
  get environment() { return getConfig().environment },
  get logging() { return getConfig().logging },
  
  // Environment checks
  get isDevelopment() { return getConfig().environment === 'development' },
  get isStaging() { return getConfig().environment === 'staging' },
  get isProduction() { return getConfig().environment === 'production' },
}

export default config
