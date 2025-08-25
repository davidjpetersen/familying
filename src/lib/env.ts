// Environment variable validation and configuration
interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY: string
  NEXT_PUBLIC_CLERK_SIGN_IN_URL?: string
  NEXT_PUBLIC_CLERK_SIGN_UP_URL?: string
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL?: string
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL?: string
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

function validateRequiredEnvVar(key: keyof EnvConfig, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new ConfigurationError(`Missing required environment variable: ${key}`)
  }
  return value.trim()
}

function validateUrl(key: keyof EnvConfig, value: string): string {
  try {
    new URL(value)
    return value
  } catch {
    throw new ConfigurationError(`Invalid URL format for environment variable: ${key}`)
  }
}

function validateEnvConfig(): EnvConfig {
  const config: EnvConfig = {
    NEXT_PUBLIC_SUPABASE_URL: validateUrl(
      'NEXT_PUBLIC_SUPABASE_URL',
      validateRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: validateRequiredEnvVar(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    SUPABASE_SERVICE_ROLE_KEY: validateRequiredEnvVar(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: validateRequiredEnvVar(
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ),
    CLERK_SECRET_KEY: validateRequiredEnvVar(
      'CLERK_SECRET_KEY',
      process.env.CLERK_SECRET_KEY
    ),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard'
  }

  // Additional validation for Supabase keys
  if (!config.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ')) {
    throw new ConfigurationError('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (should start with "eyJ")')
  }

  if (!config.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
    throw new ConfigurationError('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (should start with "eyJ")')
  }

  // Additional validation for Clerk keys
  if (!config.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    throw new ConfigurationError('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY appears to be invalid (should start with "pk_")')
  }

  if (!config.CLERK_SECRET_KEY.startsWith('sk_')) {
    throw new ConfigurationError('CLERK_SECRET_KEY appears to be invalid (should start with "sk_")')
  }

  return config
}

// Export validated configuration
export const env = validateEnvConfig()

// Export error class for use in other modules
export { ConfigurationError }
