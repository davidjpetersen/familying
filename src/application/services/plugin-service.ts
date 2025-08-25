import { Result } from '../../domain/types/result'
import { PluginEntity, PluginStatus } from '../../domain/entities/plugin'
import { PluginRepository, PluginFilters } from '../interfaces/plugin-repository'
import { EventBus } from '../../domain/events/event-bus'

/**
 * Plugin service for business operations
 */
export class PluginService {
  constructor(
    private readonly pluginRepository: PluginRepository,
    private readonly eventBus: EventBus
  ) {}

  async installPlugin(data: {
    name: string
    version: string
    author: string
    description?: string
    dependencies?: string[]
    permissions?: string[]
    config?: Record<string, unknown>
  }): Promise<Result<PluginEntity, string>> {
    try {
      // Check if plugin already exists
      const existing = await this.pluginRepository.findByName(data.name)
      if (existing) {
        return Result.failure('Plugin already exists with this name')
      }

      // Create manifest
      const manifest = {
        name: data.name,
        version: data.version,
        description: data.description || '',
        author: data.author,
        dependencies: data.dependencies || [],
        permissions: data.permissions || [],
        config: data.config || {}
      }

      // Create plugin entity
      const plugin = PluginEntity.fromManifest(manifest)

      // Save to repository
      await this.pluginRepository.save(plugin)

      return Result.success(plugin)
    } catch (error) {
      return Result.failure(`Failed to install plugin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async activatePlugin(pluginId: string): Promise<Result<PluginEntity, string>> {
    try {
      const plugin = await this.pluginRepository.findById(pluginId)
      if (!plugin) {
        return Result.failure('Plugin not found')
      }

      const activatedPlugin = plugin.activate()
      await this.pluginRepository.update(activatedPlugin)
      return Result.success(activatedPlugin)
    } catch (error) {
      return Result.failure(`Failed to activate plugin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deactivatePlugin(pluginId: string): Promise<Result<PluginEntity, string>> {
    try {
      const plugin = await this.pluginRepository.findById(pluginId)
      if (!plugin) {
        return Result.failure('Plugin not found')
      }

      const deactivatedPlugin = plugin.deactivate()
      await this.pluginRepository.update(deactivatedPlugin)
      return Result.success(deactivatedPlugin)
    } catch (error) {
      return Result.failure(`Failed to deactivate plugin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updatePlugin(
    pluginId: string,
    data: {
      config?: Record<string, unknown>
    }
  ): Promise<Result<PluginEntity, string>> {
    try {
      const plugin = await this.pluginRepository.findById(pluginId)
      if (!plugin) {
        return Result.failure('Plugin not found')
      }

      const updatedPlugin = plugin.updateConfig(data.config || {})

      await this.pluginRepository.update(updatedPlugin)
      return Result.success(updatedPlugin)
    } catch (error) {
      return Result.failure(`Failed to update plugin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async uninstallPlugin(pluginId: string): Promise<Result<void, string>> {
    try {
      const plugin = await this.pluginRepository.findById(pluginId)
      if (!plugin) {
        return Result.failure('Plugin not found')
      }

      // Deactivate first if active
      if (plugin.isActive()) {
        const deactivatedPlugin = plugin.deactivate()
        await this.pluginRepository.update(deactivatedPlugin)
      }

      // Remove from repository
      await this.pluginRepository.delete(pluginId)
      return Result.success(undefined)
    } catch (error) {
      return Result.failure(`Failed to uninstall plugin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getPluginById(id: string): Promise<Result<PluginEntity, string>> {
    try {
      const plugin = await this.pluginRepository.findById(id)
      if (!plugin) {
        return Result.failure('Plugin not found')
      }
      return Result.success(plugin)
    } catch (error) {
      return Result.failure(`Failed to get plugin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getPluginByName(name: string): Promise<Result<PluginEntity, string>> {
    try {
      const plugin = await this.pluginRepository.findByName(name)
      if (!plugin) {
        return Result.failure('Plugin not found')
      }
      return Result.success(plugin)
    } catch (error) {
      return Result.failure(`Failed to get plugin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listPlugins(filters?: PluginFilters): Promise<Result<PluginEntity[], string>> {
    try {
      const plugins = await this.pluginRepository.findAll(filters)
      return Result.success(plugins)
    } catch (error) {
      return Result.failure(`Failed to list plugins: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async listActivePlugins(): Promise<Result<PluginEntity[], string>> {
    try {
      const plugins = await this.pluginRepository.findAllActive()
      return Result.success(plugins)
    } catch (error) {
      return Result.failure(`Failed to list active plugins: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async pluginExists(name: string): Promise<Result<boolean, string>> {
    try {
      const exists = await this.pluginRepository.exists(name)
      return Result.success(exists)
    } catch (error) {
      return Result.failure(`Failed to check plugin existence: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getPluginCount(filters?: PluginFilters): Promise<Result<number, string>> {
    try {
      const count = await this.pluginRepository.count(filters)
      return Result.success(count)
    } catch (error) {
      return Result.failure(`Failed to get plugin count: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
