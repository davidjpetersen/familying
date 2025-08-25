import { PluginEntity } from '../../domain/entities/plugin'

/**
 * Plugin repository interface
 */
export interface PluginFilters {
  readonly status?: string
  readonly name?: string
  readonly author?: string
  readonly version?: string
}

export interface PluginRepository {
  findById(id: string): Promise<PluginEntity | null>
  findByName(name: string): Promise<PluginEntity | null>
  findAll(filters?: PluginFilters): Promise<PluginEntity[]>
  findAllActive(): Promise<PluginEntity[]>
  save(plugin: PluginEntity): Promise<void>
  update(plugin: PluginEntity): Promise<void>
  delete(id: string): Promise<void>
  exists(name: string): Promise<boolean>
  count(filters?: PluginFilters): Promise<number>
}

/**
 * Plugin repository error types
 */
export class PluginNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Plugin not found: ${identifier}`)
    this.name = 'PluginNotFoundError'
  }
}

export class PluginAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Plugin already exists: ${name}`)
    this.name = 'PluginAlreadyExistsError'
  }
}
