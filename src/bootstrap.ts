import { DIContainer } from './infrastructure/di/container'
import { AppConfiguration } from './infrastructure/config/app-config'
import { InMemoryEventBus } from './domain/events/event-bus'
import { SupabaseAdminRepository } from './infrastructure/repositories/supabase-admin-repository'
import { AdminService } from './application/services/admin-service'
import { InMemoryMediator } from './infrastructure/mediator/in-memory-mediator'
import {
  CreateAdminCommand,
  UpdateAdminRoleCommand,
  DeactivateAdminCommand,
  ActivateAdminCommand,
  GetAdminByIdQuery,
  GetAdminByClerkIdQuery,
  ListAdminsQuery,
  CheckAdminPermissionQuery
} from './application/use-cases/admin-use-cases'
import {
  CreateAdminCommandHandler,
  UpdateAdminRoleCommandHandler,
  DeactivateAdminCommandHandler,
  ActivateAdminCommandHandler,
  GetAdminByIdQueryHandler,
  GetAdminByClerkIdQueryHandler,
  ListAdminsQueryHandler,
  CheckAdminPermissionQueryHandler
} from './infrastructure/handlers/admin-handlers'

/**
 * Service tokens for dependency injection
 */
export const SERVICE_TOKENS = {
  // Core services
  EVENT_BUS: 'EventBus',
  MEDIATOR: 'Mediator',
  CONFIG: 'AppConfiguration',
  
  // Repositories
  ADMIN_REPOSITORY: 'AdminRepository',
  USER_REPOSITORY: 'UserRepository',
  PLUGIN_REPOSITORY: 'PluginRepository',
  
  // Application services
  ADMIN_SERVICE: 'AdminService',
  USER_SERVICE: 'UserService',
  PLUGIN_SERVICE: 'PluginService',
  
  // Command handlers
  CREATE_ADMIN_HANDLER: 'CreateAdminCommandHandler',
  UPDATE_ADMIN_ROLE_HANDLER: 'UpdateAdminRoleCommandHandler',
  DEACTIVATE_ADMIN_HANDLER: 'DeactivateAdminCommandHandler',
  ACTIVATE_ADMIN_HANDLER: 'ActivateAdminCommandHandler',
  
  // Query handlers
  GET_ADMIN_BY_ID_HANDLER: 'GetAdminByIdQueryHandler',
  GET_ADMIN_BY_CLERK_ID_HANDLER: 'GetAdminByClerkIdQueryHandler',
  LIST_ADMINS_HANDLER: 'ListAdminsQueryHandler',
  CHECK_ADMIN_PERMISSION_HANDLER: 'CheckAdminPermissionQueryHandler'
} as const

/**
 * Bootstrap the application with dependency injection
 */
export function bootstrapApplication(): DIContainer {
  const container = new DIContainer()
  
  // Register configuration
  container.registerSingleton(SERVICE_TOKENS.CONFIG, AppConfiguration.create())
  
  // Register core services
  container.registerSingleton(SERVICE_TOKENS.EVENT_BUS, new InMemoryEventBus())
  
  // Register repositories
  container.register(SERVICE_TOKENS.ADMIN_REPOSITORY, () => {
    const config = container.resolve<AppConfiguration>(SERVICE_TOKENS.CONFIG)
    return new SupabaseAdminRepository(
      config.database.url,
      config.database.anonKey
    )
  }, { singleton: true })
  
  // Register application services
  container.register(SERVICE_TOKENS.ADMIN_SERVICE, () => {
    const adminRepository = container.resolve<SupabaseAdminRepository>(SERVICE_TOKENS.ADMIN_REPOSITORY)
    const eventBus = container.resolve<InMemoryEventBus>(SERVICE_TOKENS.EVENT_BUS)
    return new AdminService(adminRepository, eventBus)
  }, { singleton: true })
  
  // Register command handlers
  container.register(SERVICE_TOKENS.CREATE_ADMIN_HANDLER, () => {
    const adminService = container.resolve<AdminService>(SERVICE_TOKENS.ADMIN_SERVICE)
    return new CreateAdminCommandHandler(adminService)
  })
  
  container.register(SERVICE_TOKENS.UPDATE_ADMIN_ROLE_HANDLER, () => {
    const adminService = container.resolve<AdminService>(SERVICE_TOKENS.ADMIN_SERVICE)
    return new UpdateAdminRoleCommandHandler(adminService)
  })
  
  container.register(SERVICE_TOKENS.DEACTIVATE_ADMIN_HANDLER, () => {
    const adminService = container.resolve<AdminService>(SERVICE_TOKENS.ADMIN_SERVICE)
    return new DeactivateAdminCommandHandler(adminService)
  })
  
  container.register(SERVICE_TOKENS.ACTIVATE_ADMIN_HANDLER, () => {
    const adminService = container.resolve<AdminService>(SERVICE_TOKENS.ADMIN_SERVICE)
    return new ActivateAdminCommandHandler(adminService)
  })
  
  // Register query handlers
  container.register(SERVICE_TOKENS.GET_ADMIN_BY_ID_HANDLER, () => {
    const adminService = container.resolve<AdminService>(SERVICE_TOKENS.ADMIN_SERVICE)
    return new GetAdminByIdQueryHandler(adminService)
  })
  
  container.register(SERVICE_TOKENS.GET_ADMIN_BY_CLERK_ID_HANDLER, () => {
    const adminService = container.resolve<AdminService>(SERVICE_TOKENS.ADMIN_SERVICE)
    return new GetAdminByClerkIdQueryHandler(adminService)
  })
  
  container.register(SERVICE_TOKENS.LIST_ADMINS_HANDLER, () => {
    const adminService = container.resolve<AdminService>(SERVICE_TOKENS.ADMIN_SERVICE)
    return new ListAdminsQueryHandler(adminService)
  })
  
  container.register(SERVICE_TOKENS.CHECK_ADMIN_PERMISSION_HANDLER, () => {
    const adminService = container.resolve<AdminService>(SERVICE_TOKENS.ADMIN_SERVICE)
    return new CheckAdminPermissionQueryHandler(adminService)
  })
  
  // Register mediator with handlers
  container.register(SERVICE_TOKENS.MEDIATOR, () => {
    const mediator = new InMemoryMediator()
    
    // Register command handlers
    const createAdminHandler = container.resolve<CreateAdminCommandHandler>(SERVICE_TOKENS.CREATE_ADMIN_HANDLER)
    const updateAdminRoleHandler = container.resolve<UpdateAdminRoleCommandHandler>(SERVICE_TOKENS.UPDATE_ADMIN_ROLE_HANDLER)
    const deactivateAdminHandler = container.resolve<DeactivateAdminCommandHandler>(SERVICE_TOKENS.DEACTIVATE_ADMIN_HANDLER)
    const activateAdminHandler = container.resolve<ActivateAdminCommandHandler>(SERVICE_TOKENS.ACTIVATE_ADMIN_HANDLER)
    
    mediator.register(CreateAdminCommand, createAdminHandler)
    mediator.register(UpdateAdminRoleCommand, updateAdminRoleHandler)
    mediator.register(DeactivateAdminCommand, deactivateAdminHandler)
    mediator.register(ActivateAdminCommand, activateAdminHandler)
    
    // Register query handlers
    const getAdminByIdHandler = container.resolve<GetAdminByIdQueryHandler>(SERVICE_TOKENS.GET_ADMIN_BY_ID_HANDLER)
    const getAdminByClerkIdHandler = container.resolve<GetAdminByClerkIdQueryHandler>(SERVICE_TOKENS.GET_ADMIN_BY_CLERK_ID_HANDLER)
    const listAdminsHandler = container.resolve<ListAdminsQueryHandler>(SERVICE_TOKENS.LIST_ADMINS_HANDLER)
    const checkPermissionHandler = container.resolve<CheckAdminPermissionQueryHandler>(SERVICE_TOKENS.CHECK_ADMIN_PERMISSION_HANDLER)
    
    mediator.registerQuery(GetAdminByIdQuery, getAdminByIdHandler)
    mediator.registerQuery(GetAdminByClerkIdQuery, getAdminByClerkIdHandler)
    mediator.registerQuery(ListAdminsQuery, listAdminsHandler)
    mediator.registerQuery(CheckAdminPermissionQuery, checkPermissionHandler)
    
    return mediator
  }, { singleton: true })
  
  return container
}

/**
 * Global application container instance
 */
let appContainer: DIContainer | null = null

/**
 * Get the application container (singleton)
 */
export function getAppContainer(): DIContainer {
  if (!appContainer) {
    appContainer = bootstrapApplication()
  }
  return appContainer
}

/**
 * Reset the application container (useful for testing)
 */
export function resetAppContainer(): void {
  appContainer = null
}
