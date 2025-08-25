import { Entity } from './user'
import { ValidationResult } from '../types/result'

/**
 * Plugin status enumeration
 */
export type PluginStatus = 'active' | 'inactive' | 'error' | 'loading'

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  readonly [key: string]: any
}

/**
 * Plugin manifest interface
 */
export interface PluginManifest {
  readonly name: string
  readonly version: string
  readonly description: string
  readonly author: string
  readonly dependencies: readonly string[]
  readonly permissions: readonly string[]
  readonly config: PluginConfig
}

/**
 * Plugin domain entity properties
 */
export interface PluginProps {
  readonly name: string
  readonly version: string
  readonly description: string
  readonly author: string
  readonly status: PluginStatus
  readonly config: PluginConfig
  readonly manifest: PluginManifest
  readonly installedAt: Date
  readonly updatedAt: Date
  readonly lastError?: string
}

/**
 * Plugin domain entity
 */
export class PluginEntity extends Entity<PluginProps> {
  private constructor(id: string, props: PluginProps) {
    super(id, props)
    const validation = this.validate()
    if (validation.isInvalid()) {
      throw new Error(`Invalid plugin: ${validation.errors.join(', ')}`)
    }
  }

  static create(props: PluginProps, id?: string): PluginEntity {
    return new PluginEntity(id ?? crypto.randomUUID(), props)
  }

  static fromManifest(manifest: PluginManifest, id?: string): PluginEntity {
    return PluginEntity.create({
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      status: 'loading',
      config: manifest.config,
      manifest,
      installedAt: new Date(),
      updatedAt: new Date()
    }, id)
  }

  get name(): string {
    return this.props.name
  }

  get version(): string {
    return this.props.version
  }

  get description(): string {
    return this.props.description
  }

  get author(): string {
    return this.props.author
  }

  get status(): PluginStatus {
    return this.props.status
  }

  get config(): PluginConfig {
    return this.props.config
  }

  get manifest(): PluginManifest {
    return this.props.manifest
  }

  get installedAt(): Date {
    return this.props.installedAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get lastError(): string | undefined {
    return this.props.lastError
  }

  // Business logic methods
  isActive(): boolean {
    return this.props.status === 'active'
  }

  isInactive(): boolean {
    return this.props.status === 'inactive'
  }

  hasError(): boolean {
    return this.props.status === 'error'
  }

  isLoading(): boolean {
    return this.props.status === 'loading'
  }

  activate(): PluginEntity {
    if (this.hasError()) {
      throw new Error('Cannot activate plugin with errors')
    }

    return new PluginEntity(this._id, {
      ...this.props,
      status: 'active',
      updatedAt: new Date(),
      lastError: undefined
    })
  }

  deactivate(): PluginEntity {
    return new PluginEntity(this._id, {
      ...this.props,
      status: 'inactive',
      updatedAt: new Date()
    })
  }

  setError(error: string): PluginEntity {
    return new PluginEntity(this._id, {
      ...this.props,
      status: 'error',
      lastError: error,
      updatedAt: new Date()
    })
  }

  updateConfig(newConfig: PluginConfig): PluginEntity {
    return new PluginEntity(this._id, {
      ...this.props,
      config: { ...this.props.config, ...newConfig },
      updatedAt: new Date()
    })
  }

  requiresPermission(permission: string): boolean {
    return this.props.manifest.permissions.includes(permission)
  }

  hasDependency(dependencyName: string): boolean {
    return this.props.manifest.dependencies.includes(dependencyName)
  }

  protected validate(): ValidationResult {
    const errors: string[] = []

    if (!this.props.name || this.props.name.trim().length === 0) {
      errors.push('Plugin name is required')
    }

    if (!this.props.version || !this.isValidVersion(this.props.version)) {
      errors.push('Valid semantic version is required')
    }

    if (!this.props.author || this.props.author.trim().length === 0) {
      errors.push('Plugin author is required')
    }

    if (!this.props.installedAt) {
      errors.push('Installation date is required')
    }

    if (!this.props.manifest) {
      errors.push('Plugin manifest is required')
    }

    return errors.length > 0 
      ? ValidationResult.failure(errors)
      : ValidationResult.success()
  }

  private isValidVersion(version: string): boolean {
    // Basic semantic version validation (major.minor.patch)
    const semverRegex = /^\d+\.\d+\.\d+$/
    return semverRegex.test(version)
  }
}
