import { readdir, readFile, stat } from 'fs/promises'
import { join, resolve } from 'path'
import { PluginManifest, Plugin, PluginRegistry, PluginContext, MigrationResult } from './types'
import { createAuthHelpers } from './auth'
import { createLogger } from './logger'
import { createDatabaseHelpers, runMigration } from './database'
import { EventEmitter } from 'events'

class PluginManager {
  private registry: PluginRegistry = {
    plugins: new Map(),
    routes: new Map(),
    health: new Map()
  }
  
  private events = new EventEmitter()
  private pluginsDir: string
  private initialized = false

  constructor(pluginsDir: string = 'packages/services') {
    this.pluginsDir = pluginsDir
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    
    console.log('Initializing plugin manager...')
    
    try {
      await this.discoverPlugins()
      await this.registerPlugins()
      await this.runMigrations()
      
      this.initialized = true
      console.log(`Plugin manager initialized with ${this.registry.plugins.size} plugins`)
    } catch (error) {
      console.error('Failed to initialize plugin manager:', error)
      throw error
    }
  }

  private async discoverPlugins(): Promise<void> {
    const pluginsPath = resolve(process.cwd(), this.pluginsDir)
    
    try {
      const entries = await readdir(pluginsPath)
      
      for (const entry of entries) {
        const pluginPath = join(pluginsPath, entry)
        const pluginStat = await stat(pluginPath)
        
        if (pluginStat.isDirectory()) {
          try {
            const plugin = await this.loadPlugin(pluginPath, entry)
            if (plugin) {
              this.registry.plugins.set(entry, plugin)
              this.registry.health.set(entry, 'unknown')
              console.log(`Discovered plugin: ${entry}`)
            }
          } catch (error) {
            console.error(`Failed to load plugin ${entry}:`, error)
          }
        }
      }
    } catch (error) {
      console.warn('No plugins directory found or error reading plugins:', error)
    }
  }

  private async loadPlugin(pluginPath: string, pluginName: string): Promise<Plugin | null> {
    try {
      // Check for required files
      const manifestPath = join(pluginPath, 'plugin.manifest.json')
      const packagePath = join(pluginPath, 'package.json')
      const indexPath = join(pluginPath, 'src/index.ts')
      
      // Validate manifest exists
      const manifestContent = await readFile(manifestPath, 'utf-8')
      const manifest: PluginManifest = JSON.parse(manifestContent)
      
      // Validate package.json exists
      await stat(packagePath)
      
      // Load the plugin module (this would need to be compiled first in a real setup)
      // For now, we'll create a mock plugin structure
      const plugin: Plugin = {
        manifest,
        register: async (context: PluginContext) => {
          // This would import and call the actual plugin's register function
          console.log(`Registering plugin: ${manifest.name}`)
          return {}
        },
        deregister: async (context: PluginContext) => {
          console.log(`Deregistering plugin: ${manifest.name}`)
        }
      }
      
      return plugin
    } catch (error) {
      console.error(`Error loading plugin from ${pluginPath}:`, error)
      return null
    }
  }

  private async registerPlugins(): Promise<void> {
    for (const [name, plugin] of this.registry.plugins) {
      try {
        const context = this.createPluginContext(plugin)
        const routes = await plugin.register(context)
        
        this.registry.routes.set(name, routes)
        this.registry.health.set(name, 'healthy')
        
        console.log(`Registered plugin: ${name}`)
      } catch (error) {
        console.error(`Failed to register plugin ${name}:`, error)
        this.registry.health.set(name, 'unhealthy')
      }
    }
  }

  private async runMigrations(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      appliedMigrations: []
    }
    
    for (const [name, plugin] of this.registry.plugins) {
      try {
        const { migrations } = plugin.manifest
        
        for (const migration of migrations) {
          const migrationPath = resolve(process.cwd(), this.pluginsDir, name, migration)
          const migrationSql = await readFile(migrationPath, 'utf-8')
          
          await runMigration(migrationSql, `${name}_${migration}`)
          result.appliedMigrations.push(`${name}/${migration}`)
          
          console.log(`Applied migration: ${name}/${migration}`)
        }
      } catch (error) {
        console.error(`Migration failed for plugin ${name}:`, error)
        result.success = false
        result.error = error instanceof Error ? error.message : 'Unknown error'
        break
      }
    }
    
    return result
  }

  private createPluginContext(plugin: Plugin): PluginContext {
    return {
      manifest: plugin.manifest,
      config: this.loadPluginConfig(plugin.manifest.name),
      logger: createLogger(plugin.manifest.name),
      auth: createAuthHelpers(),
      db: createDatabaseHelpers(),
      events: this.events
    }
  }

  private loadPluginConfig(pluginName: string): any {
    // Load configuration from environment variables or config files
    // For now, return empty config
    return {}
  }

  async deregisterAll(): Promise<void> {
    for (const [name, plugin] of this.registry.plugins) {
      try {
        if (plugin.deregister) {
          const context = this.createPluginContext(plugin)
          await plugin.deregister(context)
        }
        console.log(`Deregistered plugin: ${name}`)
      } catch (error) {
        console.error(`Failed to deregister plugin ${name}:`, error)
      }
    }
    
    this.registry.plugins.clear()
    this.registry.routes.clear()
    this.registry.health.clear()
    this.initialized = false
  }

  getRegistry(): PluginRegistry {
    return { ...this.registry }
  }

  getPlugin(name: string): Plugin | undefined {
    return this.registry.plugins.get(name)
  }

  getPluginRoutes(name: string): any {
    return this.registry.routes.get(name)
  }

  isHealthy(name: string): boolean {
    return this.registry.health.get(name) === 'healthy'
  }
}

// Singleton instance
export const pluginManager = new PluginManager()

// Initialize plugins at startup (in a real app, this would be called during app startup)
export async function initializePlugins(): Promise<void> {
  await pluginManager.initialize()
}
